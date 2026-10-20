import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { Arrow } from '../components/ApplyPill'
import { Photo } from '../components/Photo'
import { EVENTS, PROJECTS } from '../content/events'
import { EVENT_STEPS, total } from '../world/steps'
import { Mark, Peel } from '../components/Peel'
import { jump, tallestCopy, useStep } from './stage'
import './stages.css'

// Act 5 with the world (#15): one pinned stage, five sideways hard cuts, then the horizon. It starts a screen early
// (margin-top: -100lvh), so it pins the moment the peak lets go: the resolved photo cuts straight to the Gala, with no
// passage and no fade (#14). Photo-led where the departments are formation-led; the world snaps behind the frame.
// The four projects have no photos (docs/assets.md, Missing), so their cut carries no frame: no placeholder ships.

const NAMES = [...EVENTS.map((e) => e.name), 'Four more']

export default function EventsStage() {
  const root = useRef<HTMLElement>(null)
  const step = useStep('events', EVENT_STEPS)
  const cut = step >= 0 && step < 5 ? step : -1
  // --ev-copy: the tallest copy's height, so each cut can put its name on the same line and still fit the longest copy
  // below it (56). Resizes and the font swap re-measure.
  useLayoutEffect(() => {
    const stage = root.current!
    const copies = [...stage.querySelectorAll<HTMLElement>('.ev.has-photo .ev-text')]
    const measure = () => stage.style.setProperty('--ev-copy', `${tallestCopy(copies.map((c) => c.offsetHeight))}px`)
    const ro = new ResizeObserver(measure)
    copies.forEach((c) => ro.observe(c))
    measure()
    return () => ro.disconnect()
  }, [])

  return (
    <section
      ref={root}
      id="events"
      aria-labelledby="h-events"
      className="cuts events"
      data-pin
      data-sc-act="pin"
      style={{ height: `${(total(EVENT_STEPS) + 1) * 100}lvh` }}
    >
      <div className="cuts-stage" data-sc-stage data-step={step}>
        <h2 id="h-events" className="sr-only">
          Events and projects, organized by the whole club.
        </h2>
        {EVENTS.map((e, i) => (
          <article
            key={e.id}
            aria-labelledby={`ec-${e.id}`}
            className={`cut ev ${i === cut ? 'on' : ''} ${e.photo ? 'has-photo' : ''}`}
            style={{ '--c': e.accent } as CSSProperties}
          >
            {e.photo && (
              <div className="ev-frame">
                <Photo id={e.photo} sizes="(max-width: 767px) 92vw, 50vw" className="ev-img" />
              </div>
            )}
            <div className="ev-text">
              <h3 id={`ec-${e.id}`} className="cut-line">
                <Peel text={e.name} />
              </h3>
              <p className="cut-lead">{e.lead}</p>
              {e.cities && (
                <ul className="ev-cities" aria-label="Host cities">
                  {e.cities.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              )}
              {e.site && (
                <a href={e.site.href} className="ev-ig" tabIndex={i === cut ? undefined : -1}>
                  {e.site.label}
                  <span aria-hidden="true">
                    <Arrow />
                  </span>
                </a>
              )}
            </div>
          </article>
        ))}
        <article aria-labelledby="ec-projects" className={`cut ev projects ${cut === 4 ? 'on' : ''}`} style={{ '--c': '#69C4AF' } as CSSProperties}>
          <div className="ev-text">
            <h3 id="ec-projects" className="cut-line">
              <Peel text="Four more projects." />
            </h3>
          </div>
          <ul className="ev-rows">
            {PROJECTS.map((p) => (
              <li key={p.name}>
                <h4>{p.name}</h4>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </article>
        {/* the pan: an event-coloured streak sweeps over each cut as it lands */}
        {cut >= 0 && <div key={cut} className="ev-streak" aria-hidden="true" style={{ '--c': cut < 4 ? EVENTS[cut].accent : '#69C4AF' } as CSSProperties} />}
        <p className={`cuts-note ${cut === 0 ? 'on' : ''}`}>The whole club organizes every event, and every department plays a part.</p>
        <nav className={`cut-pick ev-pick ${cut >= 0 ? 'on' : ''}`} aria-label="Jump to an event">
          <div className="cut-pick-row">
            {NAMES.map((n, i) => (
              <button
                key={n}
                type="button"
                aria-current={i === cut}
                style={{ '--c': i < 4 ? EVENTS[i].accent : '#69C4AF' } as CSSProperties}
                onClick={() => jump(root.current, EVENT_STEPS, i)}
              >
                <Mark text={n} />
              </button>
            ))}
          </div>
        </nav>
      </div>
    </section>
  )
}
