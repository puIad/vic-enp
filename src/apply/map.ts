// /apply's map on a desktop (apply.css shows it from 1000px): the 9 stops down the left, the one the candidate is on, and
// each one done once its required questions have answers. Locked stops show dim (apply.css) and leave the tab order. It
// only reads the page and marks the map; it never touches an answer. Phones never see it, so it does nothing there.

import { ASKED } from './questions'

const required = new Set(ASKED.filter((q) => q.required).map((q) => q.n))

/** One stop's required questions: all it has (any department's), those showing, and those of them answered. */
export type StopCount = { required: number; shown: number; answered: number }

/**
 * Which stops are done, and the count under the map. A stop is done when its required questions showing all have
 * answers. A stop with nothing required (interview details, almost done) is never ticked and stays out of the total,
 * so a finished letter reads "6 of 6".
 */
export function tally(stops: StopCount[]): { done: boolean[]; n: number; total: number } {
  const done = stops.map((s) => s.shown > 0 && s.answered === s.shown)
  const counted = stops.map((s) => s.required > 0)
  return { done, n: done.filter((d, i) => d && counted[i]).length, total: counted.filter(Boolean).length }
}

/** a question has an answer: something typed, or a box ticked */
function answered(f: HTMLElement): boolean {
  if (f.querySelector('input:checked')) return true
  return [...f.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], input[type="tel"], input[type="date"], textarea')].some(
    (el) => el.value.trim() !== '',
  )
}

function countOf(stop: HTMLElement): StopCount {
  const all = [...stop.querySelectorAll<HTMLElement>('.ap-q[data-q]')].filter((f) => required.has(Number(f.dataset.q)))
  const shown = all.filter((f) => !f.closest('[hidden]'))
  return { required: all.length, shown: shown.length, answered: shown.filter(answered).length }
}

export function startMap() {
  const map = document.getElementById('map')
  if (!map) return
  const wide = matchMedia('(min-width: 1000px)')
  const items = [...map.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => ({ a, stop: document.querySelector<HTMLElement>(a.hash)! }))
  const ticket = items[0]
  const stops = items.slice(1)
  const count = map.querySelector<HTMLElement>('.ap-map-count')!

  const mark = () => {
    if (!wide.matches) return
    ticket.a.classList.toggle('is-done', ticket.stop.classList.contains('is-done'))
    const t = tally(stops.map((it) => countOf(it.stop)))
    stops.forEach(({ a, stop }, i) => {
      a.classList.toggle('is-done', t.done[i])
      // a stop still behind the ticket is not there to go to: out of the tab order, and said so
      const locked = stop.classList.contains('is-locked')
      a.toggleAttribute('aria-disabled', locked)
      a.tabIndex = locked ? -1 : 0
    })
    // set only on a change: the line is live, and a screen reader would read it again on every key
    const line = `${t.n} of ${t.total} stops done`
    if (count.textContent !== line) count.textContent = line
  }

  // the stop on screen: the last one whose top has passed a third of the way down
  let queued = false
  const here = () => {
    queued = false
    if (!wide.matches) return
    let current = items[0]
    for (const it of items) if (it.stop.offsetParent !== null && it.stop.getBoundingClientRect().top <= innerHeight / 3) current = it
    for (const it of items) if (it === current) it.a.setAttribute('aria-current', 'step')
    else it.a.removeAttribute('aria-current')
  }
  const queue = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(here)
  }

  document.addEventListener('input', mark)
  document.addEventListener('change', mark)
  // the ticket's proof and the choosing show or hide stops and questions without an input event of their own
  new MutationObserver(() => {
    mark()
    queue()
  }).observe(document.getElementById('letter')!, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] })
  addEventListener('scroll', queue, { passive: true })
  addEventListener('resize', queue)
  wide.addEventListener('change', () => {
    mark()
    queue()
  })
  mark()
  queue()
}
