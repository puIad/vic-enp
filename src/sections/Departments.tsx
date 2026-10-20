import { lazy, Suspense, type CSSProperties } from 'react'
import { DeptIcon } from '../components/DeptIcon'
import { ACTIVITY, MAIN, type Department } from '../content/departments'

// Act 3 (#13). With the world: the pinned stage of seven cuts (DepartmentsStage, its own chunk). Tier 0, reduced
// motion and while that chunk loads: a heading, then seven outlined cards with everything open. Four across, then three.
const Stage = lazy(() => import('./DepartmentsStage'))

function Card({ d }: { d: Department }) {
  return (
    <article
      aria-labelledby={`d-${d.id}`}
      className="card flex flex-col px-6 pt-[26px] pb-7"
      style={{ '--c': d.accent, '--c2': d.accent2 ?? d.accent } as CSSProperties}
    >
      <p className="rule">
        <b>{d.name}</b>
        <span>· {d.kind}</span>
      </p>
      <div className="mt-5">
        <DeptIcon id={d.id} />
      </div>
      <h3 id={`d-${d.id}`} className="mt-5 text-[clamp(30px,2.9vw,44px)] leading-none font-black tracking-[-0.015em] md:tracking-[-0.025em] text-white">
        {d.line}
      </h3>
      <p className="mt-4 text-base leading-normal text-gray">{d.lead}</p>
      <ul className="chips mt-5" aria-label="Skills">
        {d.flagged && <li className="flag">{d.flagged}</li>}
        {d.chips.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {d.suits && <p className="t-cap mt-4">{d.suits}</p>}
      <h4 className="mt-6 text-[13px] font-bold text-(--c)">What you'd do in {d.name}</h4>
      <ul className="mt-2 space-y-2">
        {d.does.map((x) => (
          <li key={x} className="relative pl-4 text-[15px] leading-snug text-gray before:absolute before:top-[.55em] before:left-0 before:size-1.5 before:rounded-full before:bg-(--c)">
            {x}
          </li>
        ))}
      </ul>
    </article>
  )
}

export function Departments({ staged }: { staged: boolean }) {
  if (!staged) return <Cards />
  return (
    <Suspense fallback={<Cards />}>
      <Stage />
    </Suspense>
  )
}

function Cards() {
  return (
    <section id="departments" aria-labelledby="h-dept" className="wrap pt-28 pb-32 md:pt-40 md:pb-44">
      <h2 id="h-dept" className="max-w-[18ch] text-[clamp(32px,4.4vw,64px)] leading-none font-black tracking-[-0.015em] md:tracking-[-0.025em] text-white">
        Seven departments. You pick one main and one activity.
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {MAIN.map((d) => (
          <Card key={d.id} d={d} />
        ))}
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {ACTIVITY.map((d) => (
          <Card key={d.id} d={d} />
        ))}
      </div>
    </section>
  )
}
