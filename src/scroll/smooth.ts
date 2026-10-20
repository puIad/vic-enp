import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { REDUCE } from '../lib/motion'
import { notify, world } from '../world/store'
import { remember, remembered, whereAt, yAt, type Range } from './restore'

// Loaded after first paint (App), so GSAP and Lenis stay out of the first view's JS budget (docs/quality.md).
gsap.registerPlugin(ScrollTrigger)

const abs = (el: Element) => el.getBoundingClientRect().top + scrollY
const ndc = (y: number) => 1 - (2 * y) / innerHeight

/**
 * Each act's scroll range (docs/experience.md, The journey). A pinned act (`data-pin`) owns the world from the moment
 * it pins to the moment it lets go, so a cut run's steps and the peak's progress line up with what is on screen; an
 * act that flows owns it while it holds the viewport's centre line. The close's range starts a screen early: its
 * entry (the field rising from the horizon) comes before its pinned travel.
 */
function measure(): Range[] {
  const vh = innerHeight
  const span = (id: string) => {
    const sec = document.getElementById(id)
    if (!sec) return null
    const pin = sec.matches('[data-pin]') ? sec : sec.querySelector('[data-pin]')
    if (pin) return { start: abs(pin), end: abs(pin) + (pin as HTMLElement).offsetHeight - vh }
    return { start: abs(sec) - vh / 2, end: abs(sec) + (sec as HTMLElement).offsetHeight - vh / 2 }
  }
  const dept = span('departments')
  const peak = span('club-life')
  const events = span('events')
  const apply = document.getElementById('apply')
  const applyTop = apply ? abs(apply) : document.documentElement.scrollHeight
  const out: Range[] = [{ id: 'top', start: 0, end: vh * 0.7 }]
  if (dept) out.push({ id: 'the-600', start: vh * 0.7, end: dept.start }, { id: 'departments', ...dept })
  if (peak) out.push({ id: 'club-life', ...peak })
  if (events) out.push({ id: 'events', ...events }, { id: 'join', start: events.end, end: applyTop - vh })
  if (apply) out.push({ id: 'apply', start: applyTop - vh, end: applyTop + apply.offsetHeight - vh })
  return out
}

/** Where the scroll is, into the store: the act and its progress, the horizons' lines, the close's entry, the cover. */
function follow() {
  let ranges: Range[] = []
  const up = () => document.querySelector('.horizon:not(.down)')
  const down = () => document.querySelector('.horizon.down')
  const covers = () => [document.getElementById('lightact'), document.getElementById('footer')]
  const apply = () => document.getElementById('apply')

  const update = () => {
    const y = scrollY
    const vh = innerHeight
    if (!ranges.length) return
    const at = whereAt(ranges, y)
    if (world.act !== at.act) document.documentElement.dataset.act = at.act
    world.act = at.act
    world.progress = at.progress
    // the close: entry over the screen before it pins, then its travel
    const a = apply()
    if (at.act === 'apply' && a) {
      const top = a.getBoundingClientRect().top
      world.entry = Math.min(1, Math.max(0, (vh - top) / vh))
      world.progress = Math.min(1, Math.max(0, -top / Math.max(1, a.offsetHeight - vh)))
    }
    const line = (el: Element | null, at: number) => {
      if (!el) return -9
      const b = el.getBoundingClientRect()
      const v = ndc(b.top + b.height * at)
      return v < -3 || v > 3 ? -9 : v
    }
    world.line.up = line(up(), 0.52)
    world.line.down = line(down(), 0.48)
    world.covered = covers().some((el) => {
      if (!el) return false
      const b = el.getBoundingClientRect()
      return b.top <= 0 && b.bottom >= vh
    })
    notify()
  }
  // a reload lands where the visitor was (decision 64): the place is put back on every re-measure while the staged
  // acts swap in and the page grows, until the visitor scrolls themselves or the page has long settled
  const store = (() => {
    try {
      return sessionStorage
    } catch {
      return null
    }
  })()
  const nav = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type ?? 'navigate'
  let back = store && remembered(store, nav)
  const own = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
  const mine = () => {
    back = null
    own.forEach((e) => removeEventListener(e, mine))
  }
  own.forEach((e) => addEventListener(e, mine, { passive: true }))
  const settled = setTimeout(mine, 6000)
  const keep = () => {
    if (!store || !ranges.length) return
    try {
      remember(store, whereAt(ranges, scrollY))
    } catch {
      // storage full or blocked: the next reload starts at the top
    }
  }
  const hide = () => document.visibilityState === 'hidden' && keep()

  const refresh = () => {
    ranges = measure()
    const y = back && yAt(ranges, back)
    if (y != null && Math.abs(scrollY - y) > 1) scrollTo({ top: y, behavior: 'instant' })
    update()
  }
  // the staged acts swap in after first paint and change the page's height: measure again whenever it changes
  const ro = new ResizeObserver(refresh)
  ro.observe(document.body)
  addEventListener('scroll', update, { passive: true })
  addEventListener('resize', refresh)
  addEventListener('pagehide', keep)
  document.addEventListener('visibilitychange', hide)
  document.fonts?.ready.then(refresh)
  refresh()
  return () => {
    ro.disconnect()
    mine()
    clearTimeout(settled)
    removeEventListener('scroll', update)
    removeEventListener('resize', refresh)
    removeEventListener('pagehide', keep)
    document.removeEventListener('visibilitychange', hide)
  }
}

// Lenis and ScrollTrigger on one clock: gsap's ticker drives Lenis, Lenis's scroll events update ScrollTrigger.
// Under reduced motion Lenis never starts and nothing scrubs; the acts render their still compositions instead.
// shortcut: a live switch of the OS setting swaps the acts to their stills but keeps Lenis as it started; a reload settles it.
export function startScroll() {
  document.documentElement.classList.add('sc-ready') // scroll-craft's shoot.mjs waits for this before it samples
  const stopFollow = follow()
  const triggers: ScrollTrigger[] = []
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
  const stop = () => {
    stopFollow()
    triggers.forEach((t) => t.kill())
  }
  if (matchMedia(REDUCE).matches) return stop

  const lenis = new Lenis({ anchors: true }) // honours the page's scroll-padding-top on its own
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  world.go = (y) => lenis.scrollTo(y)
  return () => {
    world.go = null
    gsap.ticker.remove(tick)
    lenis.destroy()
    stop()
  }
}
