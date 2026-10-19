import { lazy, Suspense } from 'react'
import { Photo } from '../components/Photo'
import { LEAD, LEDGER, TITLE } from '../content/clubLife'
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

const GRID = [
  ['img-8658', 'a', '(max-width: 767px) 100vw, 60vw'],
  ['img-9072', 'b', '(max-width: 767px) 50vw, 30vw'],
  ['img-0645', 'c', '(max-width: 767px) 50vw, 30vw'],
  ['img-2757', 'd', '(max-width: 767px) 50vw, 30vw'],
  ['img-9159', 'e', '(max-width: 767px) 100vw, 30vw'],
  ['img-8641', 'f', '(max-width: 767px) 50vw, 30vw'],
  ['img-7544', 'h', '(max-width: 767px) 50vw, 30vw'],
  ['img-8759', 'i', '(max-width: 767px) 100vw, 30vw'],
]

function ClubLifeStill() {
  return (
    <div className="wrap pt-28 pb-32 md:pt-40 md:pb-44">
      <h2 id="h-life" className="t-act max-w-[14ch]">
        {TITLE}
      </h2>
      <p className="t-lead mt-4 mb-12 text-gray md:mb-14">{LEAD}</p>
      <div className="peak-grid">
        {GRID.map(([id, area, s]) => (
          <Photo key={id} id={id} sizes={s} className={area} />
        ))}
        <ol>
          {LEDGER.map(([name, text]) => (
            <li key={name}>
              <h3>{name}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
