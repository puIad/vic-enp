import { Chrome } from './components/Chrome'
import { HeroPoster } from './components/Poster'
import { useCta } from './lib/opening'
import { ClubLife } from './sections/ClubLife'
import { Close, Footer } from './sections/Close'
import { Departments } from './sections/Departments'
import { Events } from './sections/Events'
import { Hero } from './sections/Hero'
import { Join } from './sections/Join'
import { WhatVic, WhyJoin } from './sections/WhatVic'

// The content layer (docs/architecture.md, Two layers). Slice 1 is the whole page on tier 0: no canvas yet.
export function App() {
  const cta = useCta()
  return (
    <>
      <div className="fx vignette" aria-hidden="true" />
      <div className="fx grain" aria-hidden="true" />
      <Chrome cta={cta} />
      <main>
        {/* the hero's poster stays behind the hero and act 2's statement and numbers, then scrolls away */}
        <div className="relative">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <HeroPoster className="sticky top-0 h-lvh w-full" />
          </div>
          <Hero cta={cta} />
          <WhatVic />
        </div>
        <WhyJoin />
        <Departments />
        <ClubLife />
        <Events />
        <Join />
        <Close cta={cta} />
      </main>
      <Footer />
    </>
  )
}
