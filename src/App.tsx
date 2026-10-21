import { useEffect } from 'react'
import { Chrome } from './components/Chrome'
import { HeroPoster } from './components/Poster'
import { useReducedMotion } from './lib/motion'
import { useCta } from './lib/opening'
import { ClubLife } from './sections/ClubLife'
import { Close, Footer } from './sections/Close'
import { Departments } from './sections/Departments'
import { Events } from './sections/Events'
import { Hero } from './sections/Hero'
import { Join } from './sections/Join'
import { WhatVic, WhyJoin } from './sections/WhatVic'
import { useWorldState } from './world/boot'
import { WorldLayer } from './world/WorldLayer'

// The content layer, then the world layer behind it (docs/architecture.md, Two layers).
export function App() {
  const cta = useCta()
  const [world, setWorld] = useWorldState()
  // the cut runs and the close's travel are staged with the world; tier 0 and reduced motion keep their cards and stills
  const reduce = useReducedMotion()
  const staged = world !== 'off' && !reduce
  // the scroll engine loads after first paint; the page reads and scrolls natively until it arrives
  useEffect(() => {
    let stop: (() => void) | undefined
    let gone = false
    import('./scroll/smooth').then((m) => {
      if (!gone) stop = m.startScroll()
    })
    return () => {
      gone = true
      stop?.()
    }
  }, [])
  return (
    <>
      {/* the world: one fixed full-screen layer behind the whole page (docs/architecture.md, Two layers) */}
      <div className="world-layer" aria-hidden="true">
        <WorldLayer state={world} setState={setWorld} />
      </div>
      <div className="fx vignette" aria-hidden="true" />
      <div className="fx grain" aria-hidden="true" />
      <Chrome cta={cta} />
      <main>
        {/* tier 0: the hero's baked poster stays behind the hero and act 2's statement and numbers, then scrolls away */}
        <div className="relative">
          {world === 'off' && (
            <div className="absolute inset-0 z-0" aria-hidden="true">
              <div className="sticky top-0 h-lvh w-full">
                <HeroPoster className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          )}
          <Hero cta={cta} />
          <WhatVic staged={staged} />
        </div>
        <WhyJoin />
        <Departments staged={staged} />
        <ClubLife />
        <Events staged={staged} />
        <Join />
        <Close cta={cta} staged={staged} />
      </main>
      <Footer staged={staged} />
    </>
  )
}
