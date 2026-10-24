import { afterEach, describe, expect, it, vi } from 'vitest'
import { Clock, setConsoleFunction, warn } from 'three'
import { isClockDeprecation, quietClock } from './quiet'

afterEach(() => {
  setConsoleFunction(null as unknown as Parameters<typeof setConsoleFunction>[0])
})

describe('quietClock', () => {
  it('drops the Clock deprecation and nothing else', () => {
    const out = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
    quietClock(out)
    new Clock()
    expect(out.warn).not.toHaveBeenCalled()
    warn('WebGLRenderer: something else')
    expect(out.warn).toHaveBeenCalledWith('THREE.WebGLRenderer: something else')
  })

  it('only matches the warning', () => {
    expect(isClockDeprecation('warn', 'THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.')).toBe(true)
    expect(isClockDeprecation('error', 'THREE.Clock: This module has been deprecated.')).toBe(false)
    expect(isClockDeprecation('warn', 'THREE.Material: onBuild() has been removed.')).toBe(false)
  })
})
