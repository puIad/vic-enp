import { RAIL } from '../lib/rail'
import { onRailLink } from './railLink'

// The footer's way back (decision 113, replacing 74's landed rail): "Missed something? Jump back", a tile per act in page
// order, numbered, the whole tile a link to its act, and the runs' and the light act's sub-sections as small links
// inside their tile. The page's keyboard route to every sub-section, since the fixed rail's sub-dots stay out of the tab
// order.
export function JumpBack() {
  return (
    <nav id="jump-back" aria-labelledby="h-jump" className="jump">
      <p className="jump-kicker">Missed something?</p>
      <h2 id="h-jump" className="jump-title">
        Jump back
      </h2>
      <ol>
        {RAIL.map((a, k) => (
          <li key={a.id} className="jump-tile" data-act={a.id}>
            <a href={`#${a.id}`} className="jump-act">
              <span className="jump-n" aria-hidden="true">
                {String(k + 1).padStart(2, '0')}
              </span>
              {a.name}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 13V3M4 7l4-4 4 4" />
              </svg>
            </a>
            {a.subs.length > 0 && (
              <ul>
                {a.subs.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="jump-sub" onClick={(e) => onRailLink(e, s.id)}>
                      {s.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
