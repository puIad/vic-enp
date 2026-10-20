import { lazy, Suspense, type CSSProperties } from 'react'
import { Arrow } from '../components/ApplyPill'
import { Photo } from '../components/Photo'
import { Mark } from '../components/Peel'
import { EVENTS, PROJECTS } from '../content/events'

// Act 5 (#15). With the world: the pinned stage of five sideways cuts (EventsStage, its own chunk). Tier 0, reduced
// motion and while that chunk loads: the title over a two-column grid of outlined event cards, then the four projects
// full width. The projects have no photos: no placeholder ships.
const Stage = lazy(() => import('./EventsStage'))

const accent = (c: string) => ({ '--c': c }) as CSSProperties

export function Events({ staged }: { staged: boolean }) {
  if (!staged) return <Cards />
  return (
    <Suspense fallback={<Cards />}>
      <Stage />
    </Suspense>
  )
}

function Cards() {
  return (
    <section id="events" aria-labelledby="h-events" className="wrap pt-28 pb-32 md:pt-40 md:pb-40">
      <h2 id="h-events" className="max-w-[18ch] text-[clamp(32px,4.4vw,64px)] leading-none font-black tracking-[-0.015em] md:tracking-[-0.025em] text-white">
        Events and projects, organized by the whole club.
      </h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {EVENTS.map((e) => (
          <article key={e.id} aria-labelledby={`e-${e.id}`} className="card flex flex-col p-6 md:p-8" style={accent(e.accent)}>
            {e.photo && (
              <Photo
                id={e.photo}
                sizes="(max-width: 767px) 92vw, 44vw"
                className="mb-6 aspect-[16/9] w-full rounded-[calc(var(--radius)-8px)] object-cover"
              />
            )}
            <h3 id={`e-${e.id}`} className="text-[clamp(34px,3.4vw,52px)] leading-none font-black tracking-[-0.015em] md:tracking-[-0.025em] text-white">
              <Mark text={e.name} />
            </h3>
            <p className="mt-4 max-w-[46ch] text-base leading-normal text-gray">{e.lead}</p>
            {e.cities && (
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Host cities">
                {e.cities.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[15px] font-bold text-white before:size-1.5 before:rounded-full before:bg-(--c) before:shadow-[0_0_8px_var(--c)]">
                    {c}
                  </li>
                ))}
              </ul>
            )}
            {e.site && (
              <a
                href={e.site.href}
                className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-(--c) px-4 text-[13px] font-bold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--c)_14%,transparent)]"
              >
                {e.site.label}
                <span className="size-4 [&_svg]:size-full">
                  <Arrow />
                </span>
              </a>
            )}
          </article>
        ))}

        <article aria-labelledby="e-projects" className="card p-6 md:col-span-2 md:p-8" style={accent('#69C4AF')}>
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-4">
              <h3 id="e-projects" className="text-[clamp(34px,3.4vw,52px)] leading-none font-black tracking-[-0.015em] md:tracking-[-0.025em] text-white">
                Four more projects.
              </h3>
            </div>
            <ul className="md:col-span-8">
              {PROJECTS.map((p) => (
                <li key={p.name} className="grid gap-1 border-t border-(--line) py-5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(10rem,1fr)_2fr] md:gap-6 md:first:pt-1">
                  <h4 className="text-[clamp(26px,2.4vw,40px)] leading-none font-black tracking-[-0.02em] text-white">{p.name}</h4>
                  <p className="text-[15px] leading-normal text-gray">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  )
}
