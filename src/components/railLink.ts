import type { MouseEvent } from 'react'
import { RAIL, ROWS } from '../lib/rail'
import { jump } from '../sections/stage'

/**
 * A rail link's jump. A cut of a staged run lands at its middle, where the pickers land (stepMiddle); everything else
 * (an act, a block, a tier 0 card) is a plain anchor that Lenis or the browser takes to its top. Shared with the
 * footer's "Jump back to" (JumpBack).
 */
export function onRailLink(e: MouseEvent, id: string) {
  const el = document.getElementById(id)
  const pin = el?.closest<HTMLElement>('[data-pin]')
  const row = ROWS.find((r) => r.id === id)
  const run = row && RAIL[row.act].run
  if (!pin || !run || row.sub < 0) return
  e.preventDefault()
  e.stopPropagation() // keeps Lenis's own anchor handling (on window) from jumping to the cut's top as well
  jump(pin, run.steps, run.first + row.sub)
}
