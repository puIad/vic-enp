// Act 2's counters (decisions.md, 63; experience.md, act 2): when a number rises it counts up once over 1.5 s and
// never resets. Pure, so the timing tests without a browser; WhatVic runs the clock.

export const COUNT_MS = 1500

/** The value a counter shows `ms` after it started, counting from `from` to `to`: whole numbers, easing out (a quartic,
 *  as in the comp, prototype/act-what-vic), so it settles onto the figure. */
export function countAt(from: number, to: number, ms: number) {
  const t = Math.min(1, Math.max(0, ms / COUNT_MS))
  return Math.round(from + (to - from) * (1 - (1 - t) ** 4))
}
