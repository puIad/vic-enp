// siteState's boundaries (docs/site-states.md, Proof), shared by the page's tests (calendar.test.ts) and the API's
// (api/_lib/site-state.test.ts) so both run the same table. Every instant comes from OPENS_AT and CLOSES_AT, so moving
// the dates next year breaks none of them.

import { CLOSES_AT, OPENS_AT, type SiteState } from './calendar.js'

const O = +OPENS_AT
const C = +CLOSES_AT
export const DAY = 864e5

/** [instant, forced, the state] at and either side of each boundary */
export const SITE_STATES: [string, number, boolean, SiteState][] = [
  ['a day before opening', O - DAY, false, 'before'],
  ['1 ms before opening', O - 1, false, 'before'],
  ['the opening instant', O, false, 'open'],
  ['1 ms after opening', O + 1, false, 'open'],
  ['1 ms before the close', C - 1, false, 'open'],
  ['the closing instant', C, false, 'off'],
  ['1 ms after the close', C + 1, false, 'off'],
  ['a day after the close', C + DAY, false, 'off'],
  ['a day before opening, forced', O - DAY, true, 'off'],
  ['1 ms before opening, forced', O - 1, true, 'off'],
  ['the opening instant, forced', O, true, 'off'],
  ['1 ms before the close, forced', C - 1, true, 'off'],
  ['the closing instant, forced', C, true, 'off'],
  ['a day after the close, forced', C + DAY, true, 'off'],
]
