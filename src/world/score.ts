// The score: where the scroll is → what the field holds (docs/experience.md, The journey). A pure function, so every
// act's state can be tested without a GPU. A's acts blend two formations by progress; B's acts snap (a = b) at each
// step boundary, with a flash; the passages switch between the speeds.

import type { ShapeKey } from './formations'
import { DEPT_STEPS, EVENT_STEPS, has, stepAt } from './steps'

export type Key = ShapeKey | 'arrive' | 'icon' | 'cloud' | 'tight' | 'photo' | 'closeRest' | 'closeIris'

export type You =
  /** a fixed spot in the view (NDC, y up), its size against the hero's and its light */
  | { x: number; y: number; size: number; alpha: number }
  /** the close's flight into the slot, 0..1 along the curve */
  | { flight: number }

export type Frame = {
  a: Key
  b: Key
  mix: number
  /** how much the blend is staggered across points (0 = all together) */
  stag: number
  /** a B cut: when it changes, the field snaps to b and flashes white for two frames */
  snap: string | null
  camZ: number
  dim: number
  drift: number
  /** depth parallax and the gaussian lean toward the pointer (A's acts) */
  lean: number
  /** the whole formation leans and sways (B's acts) */
  sway: number
  /** act 2's slow turn, radians about the cloud's centre */
  turn: number
  /** the whole field moves up or down (the horizon), in NDC */
  shift: number
  /** the ground under the field: night, or a lift of it on every second cut */
  ground: null | { color: string; alpha: number }
  you: You
}

export type ScoreIn = {
  act: string
  progress: number
  hero: number
  line: { up: number; down: number }
  entry: number
  /** the hero's arrival: the gather (0..1 over 3.2 s) and your point's light (0..1 over 0.9 s after it) */
  gather: number
  lit: number
  phone: boolean
  /** which drawn-from-file formations are ready */
  ready: { icon: boolean; photo: boolean; slot: boolean }
  /** your point's place in the icon's iris, in NDC */
  iris: [number, number] | null
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const DEPTS: ShapeKey[] = ['hr', 'fler', 'it', 'comm', 'spark', 'training', 'bubble']
const EVENTS: ShapeKey[] = ['gala', 'ignite', 'poly', 'aec', 'more']

/** Your point's places (#11, #13, #14): top right in the hero and act 2, then to one side through the cut runs. */
export const topRight = (phone: boolean): [number, number] => (phone ? [0.6, 0.66] : [0.84, 0.6])
export const cutSpot = (phone: boolean): [number, number] => (phone ? [0.8, 0.84] : [0.86, -0.48])

const base = { stag: 0, snap: null, camZ: 14, dim: 1, drift: 1, lean: 1, sway: 0, turn: 0, shift: 0, ground: null }

export function score(s: ScoreIn): Frame {
  const { act, progress: p, phone } = s
  const TR = topRight(phone)
  const CUT = cutSpot(phone)
  const at = (xy: [number, number], size: number, alpha = 1): You => ({ x: xy[0], y: xy[1], size, alpha })
  const icon = has('icon') && s.ready.icon && s.iris
  const rest: Key = icon ? 'icon' : 'cloud'

  switch (act) {
    case 'the-600': {
      // act 2 (#12): the tightened field turns slowly and dims under the benefits, back to full before the door
      const dim = 1 - 0.5 * ss(0.45, 0.6, p) * (1 - ss(0.8, 0.95, p))
      return { ...base, a: 'tight', b: 'tight', mix: 1, camZ: 8.5, turn: p * 0.28, dim, you: at(TR, 1.35) }
    }

    case 'departments': {
      const { i, t } = stepAt(DEPT_STEPS, p)
      const sway = { ...base, lean: 0, sway: 1, ground: i % 2 === 0 && i > 0 ? { color: '#1C2A37', alpha: 0.72 } : null }
      if (i === 0) {
        // the door: from act 2's far field into two slabs and a lit slit; your point slides down to its cut spot
        const m = ss(0, 0.6, t)
        const you = at([lerp(TR[0], CUT[0], ss(0, 1, t)), lerp(TR[1], CUT[1], ss(0, 1, t))], 1.35)
        return { ...sway, a: 'tight', b: 'door', mix: m, stag: 0.4, camZ: lerp(8.5, 14, m), turn: 0.28 * (1 - m), you }
      }
      if (i === DEPT_STEPS.length - 1)
        // the tunnel: dim and wordless, the camera eases forward into it
        return { ...sway, a: 'tunnel', b: 'tunnel', mix: 1, snap: 'tunnel', camZ: lerp(14, 11, ss(0, 1, t)), sway: 0.4, you: at(CUT, 1.35) }
      const k = has('cuts') ? DEPTS[i - 1] : 'door'
      return { ...sway, a: k, b: k, mix: 1, snap: has('cuts') ? `dept-${i}` : null, you: at(CUT, 1.35) }
    }

    case 'club-life': {
      // the peak (#14): the camera comes in while the points rush from the tunnel into the photo, which fades in under
      // them; they fade to 15%, and step out entirely as the photo steps aside for the stack
      const you = at(CUT, 1.35 * (1 + 0.55 * ss(0, 1, p)))
      if (has('resolve') && s.ready.photo) {
        const formed = ss(0.24, 0.31, p)
        const dim = (1 - formed * 0.85) * (1 - ss(0.4, 0.46, p))
        const still = 1 - ss(0.2, 0.26, p)
        return { ...base, a: 'tunnel', b: 'photo', mix: ss(0, 0.27, p), stag: 0.35, camZ: lerp(11, 14, ss(-0.05, 0.26, p)), dim, drift: still, lean: still, you }
      }
      // cut line item 5: the sequence opens with its first photo; the tunnel fades under it
      return { ...base, a: 'tunnel', b: 'tunnel', mix: 1, camZ: 11, dim: 1 - ss(0, 0.2, p), you }
    }

    case 'events': {
      const { i, t } = stepAt(EVENT_STEPS, p)
      const big = 1.35 * 1.55
      if (i === EVENT_STEPS.length - 1) {
        // the horizon (#15, #16): the last cut lies down into a flat line, which settles low to meet the CSS horizon
        // your point travels back to top right as the line settles (open question 28)
        const k = ss(0, 1, t)
        const you = at([lerp(CUT[0], TR[0], k), lerp(CUT[1], TR[1], k)], lerp(big, 1.35, t))
        return { ...base, a: has('cuts') ? 'more' : 'horizon', b: 'horizon', mix: ss(0, 1, t), stag: 0.3, shift: -0.75 * ss(0.3, 1, t), lean: 0.4, you }
      }
      const k = has('cuts') ? EVENTS[i] : 'horizon'
      return {
        ...base,
        a: k,
        b: k,
        mix: 1,
        snap: has('cuts') ? `event-${i}` : null,
        lean: 0,
        sway: 1,
        ground: i % 2 === 0 ? { color: '#1A2833', alpha: 0.72 } : null,
        you: at(CUT, big),
      }
    }

    case 'join': {
      // the light act (#16): the field is the horizon's line. Going in, it follows the lit line up and carries your
      // point away; coming out, it lies on the rising line and your point relights with one pulse as it passes
      const { up, down } = s.line
      if (down > -3) {
        const lit = down >= TR[1] ? 1 : 0
        const pulse = 1 + 0.6 * clamp(1 - (down - TR[1]) / 0.35) * lit
        return { ...base, a: 'horizon', b: 'horizon', mix: 1, shift: Math.max(down, -1.2), lean: 0.4, you: at(TR, 1.35 * pulse, lit) }
      }
      const line = Math.max(up, -0.75)
      return { ...base, a: 'horizon', b: 'horizon', mix: 1, shift: line, lean: 0.4, you: at([TR[0], Math.max(TR[1], line)], 1.35, up < 1.1 ? 1 : 0) }
    }

    case 'apply': {
      // the close (#17): the field rises from the horizon, dim, then makes room around the pill and rings its slot
      const e = ss(0, 1, s.entry)
      const flight = has('flight') ? ss(0.38, 0.8, p) : 1
      const you: You = p > 0 || !has('flight') ? { flight } : at(TR, 1.35, s.line.down >= TR[1] || s.entry > 0.6 ? 1 : 0)
      if (e < 1 && p <= 0) return { ...base, a: 'horizon', b: 'closeRest', mix: e, stag: 0.3, shift: (1 - e) * Math.max(s.line.down, -1.2), dim: 0.35 + 0.65 * e, you }
      const open = s.ready.slot ? ss(0.12, 0.52, p) : 0
      return { ...base, a: 'closeRest', b: 'closeIris', mix: has('flight') ? open : 1, you }
    }

    default: {
      // the hero (#11, ADR 0001): the 600 stream in and land on the icon while the counter climbs; your point lights
      // in the iris; over the 0.7 screen hand-over the icon loosens into the tightened cloud and your point drifts out
      const h = s.hero
      const youRest = icon ? s.iris! : TR
      const you = at([lerp(youRest[0], TR[0], ss(0, 1, h)), lerp(youRest[1], TR[1], ss(0, 1, h))], lerp(icon ? 0.55 : 1, 1.35, h), s.lit)
      if (s.gather < 1) return { ...base, a: 'arrive', b: rest, mix: s.gather, stag: 0.55, you }
      return { ...base, a: rest, b: 'tight', mix: h, stag: icon ? 0.25 : 0, camZ: 14 - h * 5.5, you }
    }
  }
}
