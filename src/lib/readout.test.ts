import { describe, expect, it } from 'vitest'
import { readout } from './readout'

// "Distance to the 600" (decision 110): 600 at the top, 0 at the close, whole numbers.

describe('the readout', () => {
  it('reads 600 at the top and 0 at the close', () => {
    expect(readout(0)).toBe('600')
    expect(readout(1)).toBe('0')
  })
  it('counts down in whole numbers', () => {
    expect(readout(0.5)).toBe('300')
    expect(readout(0.3333)).toBe('400')
    for (let p = 0; p <= 1; p += 0.013) expect(readout(p)).toMatch(/^\d+$/)
  })
  it('holds its ends past them', () => {
    expect(readout(-0.2)).toBe('600')
    expect(readout(1.4)).toBe('0')
  })
})
