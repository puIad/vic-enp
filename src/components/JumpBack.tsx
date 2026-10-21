import { RAIL } from '../lib/rail'
import { onRailLink } from './railLink'

// The rail landed in the footer (docs/experience.md, The rail lands in the footer; decision 74): every act and
// sub-section, labelled, on the rail's dots and line and at the rail's x. The page's keyboard route to every
// sub-section, since the fixed rail's sub-dots stay out of the tab order.
export function JumpBack() {
  return (
    <nav id="jump-back" aria-labelledby="h-jump" className="jump">
      <h2 id="h-jump" className="jump-title">
        Jump back to
      </h2>
      <ol>
        {RAIL.map((a) => (
          <li key={a.id}>
            <a href={`#${a.id}`} className="jump-act">
              <i aria-hidden="true" />
              {a.name}
            </a>
            {a.subs.length > 0 && (
              <ol>
                {a.subs.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="jump-sub" onClick={(e) => onRailLink(e, s.id)}>
                      <b aria-hidden="true" />
                      {s.name}
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
