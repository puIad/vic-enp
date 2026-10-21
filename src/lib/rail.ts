import { ACTIVITY, MAIN } from '../content/departments'
import { DEPT_STEPS, EVENT_STEPS, stepAt } from '../world/steps'

// The waypoint rail's model (docs/experience.md, The rail; decisions.md, 71 to 75 and 78): an act dot per act, a
// sub-dot per cut or block, which one is current, what flashes and the hold's rows. No DOM, so it is tested alone.

export type Sub = { id: string; name: string }
export type RailAct = {
  id: string
  name: string
  subs: Sub[]
  /** A cut run: its steps and the step of its first cut, so a staged run's sub follows the cut on screen. */
  run?: { steps: number[]; first: number }
}

export const RAIL: RailAct[] = [
  { id: 'top', name: 'Start', subs: [] },
  { id: 'the-600', name: 'The 600', subs: [] },
  {
    id: 'departments',
    name: 'Departments',
    subs: [...MAIN, ...ACTIVITY].map((d) => ({ id: `dept-${d.id}`, name: d.name })),
    run: { steps: DEPT_STEPS, first: 1 },
  },
  { id: 'club-life', name: 'Club life', subs: [] },
  {
    id: 'events',
    name: 'Events',
    subs: [
      { id: 'event-gala', name: 'GALA' },
      { id: 'event-ignite', name: 'Ignite' },
      { id: 'event-polymaze', name: 'POLYMAZE' },
      { id: 'event-aec', name: 'AEC' },
      { id: 'event-projects', name: 'Projects' },
    ],
    run: { steps: EVENT_STEPS, first: 0 },
  },
  {
    id: 'join',
    name: 'How to join',
    subs: [
      { id: 'steps', name: 'Steps' },
      { id: 'grow', name: 'Growth' },
      { id: 'faq', name: 'FAQ' },
    ],
  },
  { id: 'apply', name: 'Your place', subs: [] },
]

/** Where an act is: a staged run's progress through its pin, or its blocks' tops on screen (a flowing act, a tier 0 run). */
export type Where = { progress: number } | { tops: number[]; vh: number }

/**
 * The act's current sub-section: -1 before its first, its count once all are passed (a run's tunnel or horizon), so
 * ticks up to it read as passed and only an index inside the list is current.
 */
export function subAt(act: RailAct, at: Where) {
  if ('progress' in at) return act.run ? Math.min(act.subs.length, stepAt(act.run.steps, at.progress).i - act.run.first) : -1
  // cards on one row of tier 0's grid share a top: the row reads as its first card
  let i = -1
  at.tops.forEach((t, k) => {
    if (t <= at.vh * 0.45 && (i < 0 || t > at.tops[i] + 1)) i = k
  })
  return i
}

/** Where the visitor is on the rail: the act's index and its current sub-section (subAt). */
export type Spot = { act: number; sub: number }
/** A name showing beside its dot for about 2 s: an act's (sub -1) or a sub-section's. An act's flash on entering a run
 *  also names the cut it starts on (`names`), so that cut doesn't flash a second time. */
export type Flash = { act: number; sub: number; label: string; names?: number }

/** The flash after the visitor moves from `from` to `to`; `prev` itself when nothing new should flash. */
export function nextFlash(prev: Flash | null, from: Spot, to: Spot): Flash | null {
  const act = RAIL[to.act]
  if (!act) return prev
  if (to.act !== from.act) {
    if (!act.run) return { act: to.act, sub: -1, label: act.name }
    // at the door the run starts on its first cut; coming up from below, on its last
    const n = act.subs.length
    const names = to.sub >= 0 && to.sub < n ? to.sub : to.sub < 0 ? 0 : n - 1
    return { act: to.act, sub: -1, label: `${act.name} · ${act.subs[names].name}`, names }
  }
  if (to.sub === from.sub || to.sub < 0 || to.sub >= act.subs.length) return prev
  if (prev && prev.act === to.act && prev.names === to.sub) return prev
  return { act: to.act, sub: to.sub, label: act.subs[to.sub].name }
}

/** The rail opened by a hold (phones) or in the footer: every act, then its sub-sections, in page order. On a hold the
 *  rows share the screen's height by `share`, an act's twice a sub-section's, so a slide picks exactly on a short phone. */
export const ROWS = RAIL.flatMap((a, act) => [
  { act, sub: -1, id: a.id, name: a.name, share: 2 },
  ...a.subs.map((s, sub) => ({ act, sub, id: s.id, name: s.name, share: 1 })),
])
const SHARES = ROWS.reduce((n, r) => n + r.share, 0)

/** The row under a finger at y on a screen h tall; the first or last past either end. */
export function rowAt(y: number, h: number) {
  let at = (Math.min(Math.max(y, 0), h - 0.01) / h) * SHARES
  for (let i = 0; i < ROWS.length; i++) {
    at -= ROWS[i].share
    if (at < 0) return i
  }
  return ROWS.length - 1
}
