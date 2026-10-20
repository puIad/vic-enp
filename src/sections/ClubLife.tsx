import { lazy, Suspense } from 'react'
import { LogoSymbol } from '../components/LogoSymbol'
import { Photo } from '../components/Photo'
import { GRID, LEAD, LEDGER, TITLE } from '../content/clubLife'
import { useReducedMotion } from '../lib/motion'

// Act 4, the peak (#14). With motion: the pinned photo sequence (ClubLifePeak, its own chunk). Reduced motion,
// and while that chunk loads: one still, art-directed grid of the same eight photos. Same words in both.
const Peak = lazy(() => import('./ClubLifePeak'))

export function ClubLife() {
  const still = useReducedMotion()
  return (
    <section id="club-life" aria-labelledby="h-life" className="relative">
      {still ? (
        <ClubLifeStill />
      ) : (
        <Suspense fallback={<ClubLifeStill />}>
          <Peak />
        </Suspense>
      )}
    </section>
  )
}

// ---------- tier 0 and reduced motion ----------

function ClubLifeStill() {
  return (
    <div className="wrap pt-28 pb-32 md:pt-40 md:pb-44">
      <h2 id="h-life" className="t-act max-w-[14ch]">
        {TITLE}
      </h2>
      <p className="t-lead mt-4 mb-12 text-gray md:mb-14">{LEAD}</p>
      <div className="peak-grid">
        {GRID.map(([id, area, s], i) => (
          <Photo key={id} id={id} sizes={s} className={area} first={i === 0} />
        ))}
        <ol>
          {LEDGER.map(([name, text, logo]) => (
            <li key={name}>
              <h3>
                {logo && <LogoSymbol id={logo} />}
                {name}
              </h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
