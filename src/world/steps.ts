// The cut runs' steps (#13, #15) and the cut line's switches (docs/build-plan.md, The cut line). Shared by the world,
// the scroll engine and the staged acts, so the cut on screen and the formation behind it never disagree.

/** Departments: the door, seven cuts, the tunnel, in screens of scroll each (#13). */
export const DEPT_STEPS = [0.6, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.6]
/** Events: five cuts, then the horizon the field lies down into (#15). */
export const EVENT_STEPS = [0.7, 0.55, 0.55, 0.5, 0.7, 0.6]

export const total = (w: number[]) => w.reduce((a, b) => a + b, 0)

/** The step holding progress p (0..1 over the whole run) and how far into it p is. */
export function stepAt(w: number[], p: number) {
  const T = total(w)
  let acc = 0
  for (let i = 0; i < w.length; i++) {
    const next = acc + w[i] / T
    if (p < next || i === w.length - 1) return { i, t: Math.min(1, Math.max(0, (p - acc) / (next - acc))) }
    acc = next
  }
  return { i: w.length - 1, t: 1 }
}

/** The progress at the middle of step i: where the pickers jump to. */
export function stepMiddle(w: number[], i: number) {
  return (total(w.slice(0, i)) + w[i] / 2) / total(w)
}

/**
 * The cut line, as switches. Each item drops cleanly to the fallback the build plan names; `?cut=icon,cuts` previews
 * the page with those items cut. Bloom (item 1) was never built: the signed comps use none.
 */
export type CutItem = 'icon' | 'cuts' | 'flight' | 'resolve'
const dropped = new Set(
  (typeof location === 'undefined' ? '' : (new URLSearchParams(location.search).get('cut') ?? '')).split(',').filter(Boolean),
)
export const has = (item: CutItem) => !dropped.has(item)
