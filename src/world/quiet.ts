// three r183 deprecated Clock for Timer, but @react-three/fiber (9.8.2, the latest) still makes a Clock for every canvas,
// so every visit printed "THREE.Clock: This module has been deprecated" before the world drew a point. This drops that
// one line and hands every other three.js message to the console as before.

import { setConsoleFunction } from 'three'

type Level = 'log' | 'warn' | 'error'

/** three's Clock deprecation, which only a newer @react-three/fiber can silence at the source */
export const isClockDeprecation = (level: Level, message: unknown) =>
  level === 'warn' && typeof message === 'string' && message.startsWith('THREE.Clock: This module has been deprecated')

export function quietClock(out: Pick<Console, Level> = console) {
  setConsoleFunction((level: Level, message: unknown, ...params: unknown[]) => {
    if (!isClockDeprecation(level, message)) out[level](message, ...params)
  })
}
