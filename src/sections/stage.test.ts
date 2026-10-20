import { describe, expect, it } from 'vitest'
import { tallestCopy } from './stage'

describe('the events cut copy (56)', () => {
  it('makes room for the tallest copy, rounded up so a sub-pixel line never spills', () => {
    // Gala, Ignite, POLYMAZE and AEC as measured at 360x640
    expect(tallestCopy([269, 230.5, 230.5, 333.2])).toBe(334)
  })

  it('reserves nothing before the copy is measured', () => {
    expect(tallestCopy([])).toBe(0)
  })
})
