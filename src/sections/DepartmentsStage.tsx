import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { ACTIVITY, MAIN, type Department } from '../content/departments'
import { DEPT_STEPS, total } from '../world/steps'
import { world } from '../world/store'
import { Peel } from '../components/Peel'
import { jump, useStep } from './stage'

// Act 3 with the world (#13): one pinned stage, the door, seven hard cuts, the tunnel. The world snaps the formation
// at each step boundary (score.ts); this is the copy that cuts with it. Its own chunk, loaded after first paint;
// Departments shows the tier 0 cards until it arrives.

const ALL = [...MAIN, ...ACTIVITY]

function Cut({ d, n, on, open, onToggle }: { d: Department; n: number; on: boolean; open: boolean; onToggle: () => void }) {
  const panel = `dw-${d.id}`
  const off = on ? undefined : -1
  return (
    <article
      aria-labelledby={`dc-${d.id}`}
      className={`cut ${on ? 'on' : ''} ${open ? 'open' : ''}`}
      style={{ '--c': d.accent, '--c2': d.accent2 ?? d.accent } as CSSProperties}
      data-n={n}
    >
      <p className="cut-label">
        <b>{d.name}</b> <span>· {d.kind}</span>
      </p>
      <h3 id={`dc-${d.id}`} className="cut-line">
        <Peel text={d.line} />
      </h3>
      <div className="cut-body">
        <p className="cut-lead">{d.lead}</p>
        <ul className="chips cut-chips" aria-label="Skills">
          {d.flagged && <li className="flag">{d.flagged}</li>}
          {d.chips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {d.suits && <p className="cut-suits">{d.suits}</p>}
      </div>
      <button type="button" className="cut-more" aria-expanded={open} aria-controls={panel} tabIndex={off} onClick={onToggle}>
        What you'd do <i aria-hidden="true" />
      </button>
      {/* the panel is in the reading order even while closed (opacity, not hidden), so the whole act reads without the stage */}
      <div id={panel} className="cut-panel" role="region" aria-label={`What you'd do in ${d.name}`}>
        <ul>
          {d.does.map((x) => (
            <li key={x}>{x}</li>
          ))}
          {d.suits && <li className="suits-m">{d.suits}</li>}
        </ul>
      </div>
    </article>
  )
}

export default function DepartmentsStage() {
  const root = useRef<HTMLElement>(null)
  const step = useStep('departments', DEPT_STEPS)
  const cut = step >= 1 && step <= ALL.length ? step - 1 : -1
  const [open, setOpen] = useState(-1)
  // the panel closes on the next cut
  const [was, setWas] = useState(cut)
  if (was !== cut) {
    setWas(cut)
    setOpen(-1)
  }

  // a tap on the cluster (anywhere that is not a control) pulses the formation and opens the panel in place
  const tap = (e: PointerEvent) => {
    if (cut < 0 || (e.target as Element).closest('button, a, .cut-panel, .cut-pick')) return
    world.pulse = performance.now()
    setOpen(cut)
  }

  return (
    <section
      ref={root}
      id="departments"
      aria-labelledby="h-dept"
      className="cuts"
      data-pin
      data-sc-act="pin"
      style={{ height: `${(total(DEPT_STEPS) + 1) * 100}lvh` }}
    >
      <div className="cuts-stage" data-sc-stage onPointerDown={tap} data-step={step}>
        <h2 id="h-dept" className="sr-only">
          Seven departments. You pick one main and one activity.
        </h2>
        {ALL.map((d, i) => (
          <Cut key={d.id} d={d} n={i} on={i === cut} open={i === open} onToggle={() => setOpen((o) => (o === i ? -1 : i))} />
        ))}
        <p className={`cuts-note ${cut === 0 ? 'on' : ''}`}>You pick one main and one activity department when you apply.</p>
        <nav className={`cut-pick ${cut >= 0 ? 'on' : ''}`} aria-label="Jump to a department">
          {[
            ['Main', MAIN, 0],
            ['Activity', ACTIVITY, MAIN.length],
          ].map(([name, list, at]) => (
            <div key={name as string} className="cut-pick-row">
              <small>{name as string}</small>
              {(list as Department[]).map((d, k) => {
                const i = (at as number) + k
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-current={i === cut}
                    style={{ '--c': d.accent } as CSSProperties}
                    onClick={() => jump(root.current, DEPT_STEPS, i + 1)}
                  >
                    {d.name}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </section>
  )
}
