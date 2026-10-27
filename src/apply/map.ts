// /apply's map on a desktop (apply.css shows it from 1000px): the 9 stops down the left, the one the candidate is on, and
// each one done once its required questions have answers. Locked stops are apply.css's (:has on the stops). It only
// reads the page and marks the map; it never touches an answer. Phones never see it, so it does nothing there.

import { ASKED } from './questions'

const required = new Set(ASKED.filter((q) => q.required).map((q) => q.n))
const WIDE = matchMedia('(min-width: 1000px)')

/** a question has an answer: something typed, or a box ticked */
function answered(f: HTMLElement): boolean {
  if (f.querySelector('input:checked')) return true
  return [...f.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], input[type="tel"], input[type="date"], textarea')].some(
    (el) => el.value.trim() !== '',
  )
}

/** a stop is done when it asks something required and every required question showing in it has an answer */
function done(stop: HTMLElement): boolean {
  if (stop.id === 'ticket') return stop.classList.contains('is-done')
  const asked = [...stop.querySelectorAll<HTMLElement>('.ap-q[data-q]')].filter((f) => required.has(Number(f.dataset.q)) && !f.closest('[hidden]'))
  return asked.length > 0 && asked.every(answered)
}

export function startMap() {
  const map = document.getElementById('map')
  if (!map) return
  const items = [...map.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')].map((a) => ({ a, stop: document.querySelector<HTMLElement>(a.hash)! }))
  const count = map.querySelector<HTMLElement>('.ap-map-count')!

  const mark = () => {
    if (!WIDE.matches) return
    let n = 0
    for (const { a, stop } of items) {
      const d = done(stop)
      a.classList.toggle('is-done', d)
      if (d && stop.id !== 'ticket') n++
    }
    // set only on a change: the line is live, and a screen reader would read it again on every key
    const line = `${n} of ${items.length - 1} stops done`
    if (count.textContent !== line) count.textContent = line
  }

  // the stop on screen: the last one whose top has passed a third of the way down
  let queued = false
  const here = () => {
    queued = false
    if (!WIDE.matches) return
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
  WIDE.addEventListener('change', () => {
    mark()
    queue()
  })
  mark()
  queue()
}
