// The desktop map's count (map.ts): a stop with nothing required never holds the count back from its total.
import { describe, expect, it } from 'vitest'
import { tally } from './map'

const all = (n: number) => ({ required: n, shown: n, answered: n })
const none = { required: 0, shown: 0, answered: 0 }

describe('the map count', () => {
  it('reads n of n on a finished letter, the stops with nothing required left out', () => {
    // stops 1 to 6 answered, 7 (interview details) and 8 (almost done) ask nothing required
    const t = tally([all(4), all(2), all(2), all(1), all(2), { required: 13, shown: 4, answered: 4 }, none, none])
    expect(t).toMatchObject({ n: 6, total: 6 })
    expect(t.done.slice(6)).toEqual([false, false])
  })

  it('leaves a stop undone while a required question showing has no answer', () => {
    expect(tally([{ required: 4, shown: 4, answered: 3 }]).done).toEqual([false])
  })

  it('keeps the department stop undone before the choosing, its questions all hidden', () => {
    const t = tally([{ required: 13, shown: 0, answered: 0 }])
    expect(t).toMatchObject({ done: [false], n: 0, total: 1 })
  })
})
