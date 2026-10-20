import { afterEach, describe, expect, it } from 'vitest'
import { notify, world } from './store'
import { meter, watchLoop } from './loop'

// The world's render loop (decision 64): it stops while nothing would be seen, the tab hidden or an opaque act over it.

function tab(state: 'visible' | 'hidden' = 'visible') {
  const t = new EventTarget() as EventTarget & { visibilityState: DocumentVisibilityState }
  t.visibilityState = state
  const set = (s: DocumentVisibilityState) => {
    t.visibilityState = s
    t.dispatchEvent(new Event('visibilitychange'))
  }
  return { doc: t, set }
}

afterEach(() => {
  world.covered = false
})

describe('watchLoop', () => {
  it('stops the loop while the tab is hidden and starts it again when it is shown', () => {
    const { doc, set } = tab()
    const calls: string[] = []
    watchLoop(doc, (l) => calls.push(l))
    set('hidden')
    set('visible')
    expect(calls).toEqual(['never', 'always'])
  })

  it('starts stopped on a tab that loads hidden', () => {
    const calls: string[] = []
    watchLoop(tab('hidden').doc, (l) => calls.push(l))
    expect(calls).toEqual(['never'])
  })

  it('stops under an opaque act and stays stopped when the act lifts on a hidden tab', () => {
    const { doc, set } = tab()
    const calls: string[] = []
    watchLoop(doc, (l) => calls.push(l))
    world.covered = true
    notify()
    set('hidden')
    world.covered = false
    notify()
    expect(calls).toEqual(['never'])
    set('visible')
    expect(calls).toEqual(['never', 'always'])
  })

  it('stops listening once disposed', () => {
    const { doc, set } = tab()
    const calls: string[] = []
    watchLoop(doc, (l) => calls.push(l))()
    set('hidden')
    world.covered = true
    notify()
    expect(calls).toEqual([])
  })
})

describe('meter', () => {
  it('reads the frame rate once a second has passed', () => {
    const m = meter()
    const out = [0, 0.25, 0.5, 0.75, 1].map((t) => m(t))
    expect(out).toEqual([null, null, null, null, 4])
  })

  it('measures from the first frame after a pause, so the time away never counts', () => {
    const m = meter()
    m(0)
    m(0.5)
    m.pause()
    // R3F's clock restarts at 0 when the loop starts again
    expect([0, 0.5, 1].map((t) => m(t))).toEqual([null, null, 2])
  })
})
