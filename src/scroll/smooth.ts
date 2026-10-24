import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { REDUCE } from '../lib/motion'
import { arrival } from '../world/arrival'
import { notify, world } from '../world/store'
import { underBenefits } from '../lib/scrub'
import { CLOSE_LANDS, DEPT_STEPS, EVENT_STEPS, PEAK_HOLD, peakRest, stepMiddle } from '../world/steps'
import { GLIDE, catcher, coastCurve, type Layout, type Move, type Run } from './catch'
import { restorer, whereAt, type Range } from './restore'
import { touchCatch } from './touch'

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
 * The catch's 26 points (docs/experience.md, The catch; decisions.md, 88, 92 and 97). Three runs: the 7 departments and
 * the 5 events at their cuts' middles (where the pickers land), the peak from its resolved group photo through its ten
 * photos at their rests. Each run's zone is its pinned stage; leaving the departments goes at least a screen past it,
 * so nothing rests on the door or the tunnel; the peak's opening and end (the ENP photo's return) and the events' end (the horizon) are the flow's. Three
 * still points: act 2's top and the light act's (where the rail lands) and the close at rest with your point in its
 * slot. None on tier 0 or after a lost context, where the runs are cards and nothing is pinned.
 */
function catchLayout(ranges: Range[]): Layout {
  const vh = innerHeight
  const limit = document.documentElement.scrollHeight - vh
  if (!document.querySelector('#departments[data-pin]')) return { runs: [], still: [], limit }
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const range = (id: string) => ranges.find((x) => x.id === id)
  const along = (r: Range, p: number) => r.start + p * (r.end - r.start)
  const runs: Run[] = []
  const cuts = (id: string, steps: number[], from: number, to: number) => {
    const r = range(id)
    if (!r || !document.querySelector(`#${id}[data-pin]`)) return null
    const stops = []
    for (let i = from; i <= to; i++) stops.push(along(r, stepMiddle(steps, i)))
    const run = { stops, lo: r.start, hi: r.end, up: r.start - vh, down: r.end + vh }
    runs.push(run)
    return run
  }
  // a run whose end is the flow's: its zone ends a hair past its last stop, so that stop is still in it and a gesture
  // there scrolls on from it
  const flowOut = (r: Run) => {
    const last = r.stops[r.stops.length - 1]
    r.hi = last + 2
    r.down = last
  }
  cuts('departments', DEPT_STEPS, 1, 7)
  const peak = range('club-life')
  if (peak && document.querySelector('#club-life [data-pin]')) {
    const photos = document.querySelectorAll('#club-life .peak-card').length
    const stops = [along(peak, (PEAK_HOLD[0] + PEAK_HOLD[1]) / 2)]
    for (let i = 0; i < photos; i++) stops.push(along(peak, peakRest(i)))
    // the peak's end is the flow's too (decision 137): past the tenth photo the ENP photo returns full frame at your own
    // pace, and the Gala's door catches whatever reaches it
    const run = { stops, lo: stops[0], hi: peak.end, up: stops[0], down: peak.end }
    flowOut(run)
    runs.push(run)
  }
  const events = cuts('events', EVENT_STEPS, 0, 4)
  // the events' end is the flow's, as the peak's opening is (decision 115): past the projects cut the field lies down
  // into the horizon at your own pace, and coasting stops on the light act's top
  if (events) flowOut(events)
  const still: number[] = []
  const top = (id: string) => {
    const el = document.getElementById(id)
    if (el) still.push(abs(el) - pad)
  }
  top('the-600')
  top('join')
  // the close at rest: a beat after your point lands in its slot
  const apply = document.getElementById('apply')
  if (apply?.matches('[data-pin]')) still.push(abs(apply) + (CLOSE_LANDS + 0.05) * (apply.offsetHeight - vh))
  // a run's exit carries on to a still point within half a screen past it
  for (const r of runs) {
    r.down = still.find((p) => p >= r.down && p - r.down <= vh / 2) ?? r.down
    r.up = [...still].reverse().find((p) => p <= r.up && r.up - p <= vh / 2) ?? r.up
  }
  return { runs, still, limit }
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
  // scroll-craft's shoot.mjs waits for this before it samples: once the hero has stopped waiting for the icon, so a
  // fresh browser's first load (and its lock, world/arrival.ts) never reads as dead scroll
  const ready = () => {
    if (arrival.phase === 'wait') return
    document.documentElement.classList.add('sc-ready')
    arrival.listeners.delete(ready)
  }
  arrival.listeners.add(ready)
  ready()
  // the catch (decisions 87 to 98): on the wheel inside Lenis's virtualScroll hook below, on touch in touch.ts, where
  // the page owns its touch scrolling; both drag, glide to a stop, or coast on with the page's own momentum. Keys, anchors and every scrollTo (world.go, the restore) never reach it. Off
  // under reduced motion; `?catch=off` turns it off to compare.
  const catching = !matchMedia(REDUCE).matches && new URLSearchParams(location.search).get('catch') !== 'off'
  const caught = catcher(() => innerHeight)
  let phone: ReturnType<typeof touchCatch> | null = null
  let layout: Layout = { runs: [], still: [], limit: 0 }
  const stopFollow = follow((ranges) => {
    layout = catchLayout(ranges)
    caught.layout(layout)
    phone?.layout(layout)
  })
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
    phone?.stop()
    stopFollow()
    triggers.forEach((t) => t.kill())
  }
  if (matchMedia(REDUCE).matches) return stop

  const ease = (t: number) => 1 - (1 - t) ** 3
  // our glides carry their end in Lenis's userData, so a jump that replaces one (an anchor, the rail) ends it too
  const anim = () => {
    const at = lenis.isScrolling === 'smooth' ? lenis.userData?.catch : undefined
    return typeof at === 'number' ? at : null
  }
  const glideTo = (y: number) => lenis.scrollTo(y, { duration: GLIDE / 1000, easing: ease, force: true, userData: { catch: y } })
  const play = (m: Move) => {
    if ('scroll' in m) lenis.scrollTo(m.scroll, { immediate: true, force: true })
    else if ('glide' in m) glideTo(m.glide)
    else {
      const c = coastCurve(lenis.animatedScroll, m.coast, m.v)
      if (!c) glideTo(m.coast)
      else lenis.scrollTo(m.coast, { duration: c.ms / 1000, easing: c.easing, force: true, userData: { catch: m.coast } })
    }
  }
  // a finger down or a new wheel gesture stops a coast where it is, as it stops a fling (Lenis's own reset, through its
  // public switch)
  const halt = () => {
    lenis.stop()
    lenis.start()
  }
  let frame = performance.now() // the last frame drawn: none for 100 ms means the page, not the visitor, paused the wheel
  const lenis: Lenis = new Lenis({
    anchors: true, // honours the page's scroll-padding-top on its own
    virtualScroll: ({ deltaY, event }) => {
      if (!catching) return true
      // touch is touch.ts's while it owns it: Lenis would stop our glides on every touch event
      if (event.type.startsWith('touch')) return !phone?.owns()
      if (event.type !== 'wheel' || event.ctrlKey || !deltaY || lenis.isStopped || lenis.isLocked) return true
      const from = lenis.targetScroll
      const to = Math.min(lenis.limit, Math.max(0, from + deltaY))
      const stalled = performance.now() - frame > 100
      const v = caught.wheel({ t: event.timeStamp, dy: deltaY, from, to, glide: anim(), stalled })
      if (v === 'pass') return true
      if (v === 'halt') {
        halt()
        return true
      }
      event.preventDefault()
      if (v !== 'hold') play(v.v === undefined ? { glide: v.at } : { coast: v.at, v: v.v })
      return false
    },
  })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => {
    frame = performance.now()
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  // on touch the page drags under the finger, glides to a stop, or coasts on with the lift's momentum
  if (catching) {
    phone = touchCatch({
      y: () => lenis.animatedScroll,
      anim,
      play,
      halt,
    })
    phone.layout(layout)
  }
  world.go = (y) => {
    phone?.cancel()
    caught.cancel()
    lenis.scrollTo(y)
  }
  return () => {
    world.go = null
    gsap.ticker.remove(tick)
    lenis.destroy()
    stop()
  }
}
