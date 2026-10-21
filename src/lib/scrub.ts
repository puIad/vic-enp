// The word scrub (GLOSSARY.md, decisions.md 62 and 63): words light one by one as the visitor scrolls, act 2's
// title and sentences and the closing motto. The sections set one progress on the block (--sk) and a start on each
// word (--a); index.css lights a word over the next 5% of progress (--sl, a quarter for the motto). Pure, so the timing
// tests without a browser.

/** When each of n words starts to light: evenly from `from`, the last one starting a step before `to`. */
export const wordStarts = (n: number, from: number, to: number) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / n)

/** A run of copy: plain words, or words in bold (act 2's "VIC", "Our mission:"). */
export type Part = string | { b: string }

/** A run's words as written. */
export const textOf = (p: Part) => (typeof p === 'string' ? p : p.b)

/** The words of some copy, each marked bold or not. */
export const wordsOf = (parts: Part[]) =>
  parts.flatMap((p) => textOf(p).split(/\s+/).filter(Boolean).map((w) => ({ w, bold: typeof p !== 'string' })))

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/**
 * How far act 2's field is under the benefits, 0..1, from where the benefits' top and the door's top sit on screen:
 * it dims as the benefits come up from 90% to 20% of the screen, and is back to full before the door reaches 30%
 * (experience.md, act 2's World). Measured on the page, since the pin's length moves where the benefits fall.
 */
export const underBenefits = (benefitsTop: number, doorTop: number, vh: number) =>
  ss(vh * 0.9, vh * 0.2, benefitsTop) * (1 - ss(vh, vh * 0.3, doorTop))

/**
 * Act 2's progress at scroll y, its pin at `top` and `height` tall on a `vh` screen: from the title reaching mid-screen
 * (half a screen before the pin) to the pin letting go, as in the comp (prototype/act-what-vic).
 */
export const act2Progress = (y: number, top: number, height: number, vh: number) => clamp((y - (top - vh / 2)) / (height - vh / 2))

/**
 * The closing motto's progress at scroll y, the motto at `top` and `height` tall: from its top entering the screen to
 * its bottom reaching mid-screen, or to the page's last scroll position `maxY` if that comes first, so it is always
 * whole at the bottom of the page.
 */
export function mottoProgress(y: number, top: number, height: number, vh: number, maxY: number) {
  const start = top - vh
  const end = Math.min(maxY, top + height - vh / 2)
  return clamp((y - start) / Math.max(1, end - start))
}
