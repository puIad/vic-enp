import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { TIER, html, type WorldState } from './boot'
import { forcedTier } from './tier'

// The world's door into the content layer. Tiny on purpose: three, R3F and the scene live in the World chunk, which
// loads on an idle callback after first paint, so the first view's JS budget and the content's LCP don't carry it.

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
  const [go, setGo] = useState(false)

  useEffect(() => {
    if (state === 'off') return
    // after first paint, when the main thread is free (Safari has no requestIdleCallback)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setGo(true), { timeout: 2500 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(() => setGo(true), 700)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    html.classList.toggle('w-on', state !== 'off')
    html.classList.toggle('w-ready', state === 'ready')
  }, [state])

  if (state === 'off' || !go) return null
  const off = () => setState('off')
  return (
    <Fallback onError={off}>
      <Suspense fallback={null}>
        <World
          tier={TIER as 1 | 2}
          forced={forcedTier(location.search) !== null}
          formed={STILL}
          still={STILL}
          onReady={() => setState('ready')}
          onLost={off}
        />
      </Suspense>
    </Fallback>
  )
}
