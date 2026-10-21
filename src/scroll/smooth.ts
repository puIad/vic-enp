import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { REDUCE } from '../lib/motion'
import { notify, world } from '../world/store'
import { underBenefits } from '../lib/scrub'
import { DEPT_STEPS, EVENT_STEPS, stepMiddle } from '../world/steps'
import { catcher, type Point } from './catch'
import { restorer, whereAt, type Range } from './restore'

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

/**
 * The catch's 16 points (docs/experience.md, The catch): the 12 cuts at their middles (where the pickers land), act 2's
 * top and the light act's (where the rail lands), the peak's resolved photo in its hold, and the close at rest with your
 * point in its slot. None on tier 0 or after a lost context, where the runs are cards and nothing is pinned.
 */
function catchPoints(ranges: Range[]): Point[] {
  if (!document.querySelector('#departments[data-pin]')) return []
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const out: Point[] = []
  const top = (id: string) => {
    const el = document.getElementById(id)
    if (el) out.push({ y: abs(el) - pad })
  }
  const along = (id: string, p: number, run?: string) => {
    const r = ranges.find((x) => x.id === id)
    if (r) out.push({ y: r.start + p * (r.end - r.start), run })
  }
  top('the-600')
  for (let i = 1; i <= 7; i++) along('departments', stepMiddle(DEPT_STEPS, i), 'departments')
  along('club-life', 0.355) // the photo's hold, 0.31 to 0.40 of the peak (ClubLifePeak)
  for (let i = 0; i < 5; i++) along('events', stepMiddle(EVENT_STEPS, i), 'events')
  top('join')
  // your point lands at 0.8 of the close's travel (score.ts); the rest is the close at rest
  const apply = document.getElementById('apply')
  if (apply?.matches('[data-pin]')) out.push({ y: abs(apply) + 0.85 * (apply.offsetHeight - innerHeight) })
  return out
}

/** Where the scroll is, into the store: the act and its progress, act 2's dim, the horizons' lines, the close's entry, the cover. */
function follow(measured: (ranges: Range[]) => void) {
  let ranges: Range[] = []
  const up = () => document.querySelector('.horizon:not(.down)')
  const down = () => document.querySelector('.horizon.down')
  const covers = () => [document.getElementById('lightact'), document.getElementById('footer')]
  const apply = () => document.getElementById('apply')
  const benefits = () => document.getElementById('benefits')
  const door = () => document.getElementById('departments')

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
    // act 2's field dims under the benefits (#36)
    const b = benefits()
    const d = door()
    world.under = b && d ? underBenefits(b.getBoundingClientRect().top, d.getBoundingClientRect().top, vh) : 0
    world.line.up = line(up(), 0.52)
    world.line.down = line(down(), 0.48)
    world.covered = covers().some((el) => {
      if (!el) return false
      const b = el.getBoundingClientRect()
      return b.top <= 0 && b.bottom >= vh
    })
    notify()
  }
  // a reload lands where the visitor was (decision 64), in the same act and step, however the page has grown
  const back = restorer()
  const keep = () => back.keep(ranges, scrollY)
  const hide = () => document.visibilityState === 'hidden' && keep()

  const refresh = () => {
    ranges = measure()
    measured(ranges)
    const y = back.place(ranges)
    if (y !== null && Math.abs(scrollY - y) > 1) scrollTo({ top: y, behavior: 'instant' })
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
    back.stop()
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
  const caught = catcher()
  const stopFollow = follow((ranges) => caught.points(catchPoints(ranges)))
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

  // the catch works on the wheel only: keys, touch, anchors and every scrollTo (world.go, the restore) never reach it.
  // `?catch=off` turns it off to compare.
  const catching = new URLSearchParams(location.search).get('catch') !== 'off'
  const glide = (t: number) => 1 - (1 - t) ** 3
  const lenis: Lenis = new Lenis({
    anchors: true, // honours the page's scroll-padding-top on its own
    virtualScroll: ({ deltaY, event }) => {
      if (!catching || event.type !== 'wheel' || event.ctrlKey || !deltaY) return true
      const to = Math.min(lenis.limit, Math.max(0, lenis.targetScroll + deltaY))
      const v = caught.wheel({ t: event.timeStamp, dy: deltaY, from: lenis.animatedScroll, to })
      if (v === 'pass') return true
      event.preventDefault()
      if (v !== 'hold') lenis.scrollTo(v.at, { duration: 0.4, easing: glide })
      return false
    },
  })
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
