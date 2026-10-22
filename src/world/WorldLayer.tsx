import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { gatherStarted, reveal, startCap } from './arrival'
import { TIER, html, type WorldState } from './boot'
import { forcedTier } from './tier'

// The world's door into the content layer. Tiny on purpose: three, R3F and the scene live in the World chunk, so the
// first view's JS budget doesn't carry it. It starts loading at once: the hero's copy waits for the 600 (decision 109).

const World = lazy(() => import('./World'))
const params = new URLSearchParams(location.search)
const STILL = params.has('still')

/** A chunk that fails to load, or a renderer that can't get a context, drops the page to tier 0. */
class Fallback extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function WorldLayer({ state, setState }: { state: WorldState; setState: (s: WorldState) => void }) {
  // React's first effects run once the first frame is painted
  useEffect(startCap, [])

  useEffect(() => {
    html.classList.toggle('w-on', state !== 'off')
    html.classList.toggle('w-ready', state === 'ready')
    // a world that failed or lost its context shows the hero's copy at once (decision 109)
    if (state === 'off') reveal()
  }, [state])

  if (state === 'off') return null
  const off = () => setState('off')
  return (
    <Fallback onError={off}>
      <Suspense fallback={null}>
        <World
          tier={TIER as 1 | 2}
          forced={forcedTier(location.search) !== null}
          still={STILL}
          onReady={() => {
            gatherStarted()
            setState('ready')
          }}
          onLit={reveal}
          onLost={off}
        />
      </Suspense>
    </Fallback>
  )
}
