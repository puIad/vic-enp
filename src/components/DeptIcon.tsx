import type { ReactNode } from 'react'
import type { DeptIcon as Id } from '../content/departments'

// Seven outlined icons for the tier 0 department cards (#13), each a flat echo of its cut's formation.
// Outlines only: nothing here is a ring with a lit centre. The iris belongs to the hero's icon and the close's slot
// (ADR 0001); everywhere else the page stays eye-free by choice.
const paths: Record<Id, ReactNode> = {
  // HR: six clumps on a ring, joined
  hr: (
    <>
      <path d="M12 4.5 18.5 8.25v7.5L12 19.5l-6.5-3.75v-7.5Z" strokeDasharray="2.2 2.4" />
      {[
        [12, 4.5],
        [18.5, 8.25],
        [18.5, 15.75],
        [12, 19.5],
        [5.5, 15.75],
        [5.5, 8.25],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.7" />
      ))}
    </>
  ),
  // FLER: bars rising
  fler: <path d="M5 19v-4M9.5 19v-7M14 19V9M18.5 19V5M3.5 19.5h17" />,
  // IT: a viewfinder with rule-of-thirds lines
  it: (
    <>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <path d="M9.5 6.5v11M14.5 6.5v11M6.5 9.5h11M6.5 14.5h11" strokeOpacity=".55" />
    </>
  ),
  // COMM: a broadcast spreading from one source
  comm: <path d="M5 19a1 1 0 1 0 0-.01M5 14a5 5 0 0 1 5 5M5 9.5a9.5 9.5 0 0 1 9.5 9.5M5 5a14 14 0 0 1 14 14" />,
  // SPARK: a burst of rays, open at the centre
  spark: <path d="M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2" />,
  // Training: treads ascending
  training: <path d="M3.5 19.5h4v-4h4v-4h4v-4h5" />,
  // English Bubble: two open speech circles, overlapping
  bubble: (
    <>
      <path d="M10 15.5a5.5 5.5 0 1 1 4.6-2.5l.9 3-3.2-.9a5.5 5.5 0 0 1-2.3.4Z" />
      <path d="M15.9 9.2a4.6 4.6 0 0 1 2.6 7.6l.6 2.4-2.6-.7a4.6 4.6 0 0 1-4.8-.8" strokeOpacity=".7" />
    </>
  ),
}

export function DeptIcon({ id }: { id: Id }) {
  return (
    <span className="grid size-11 place-items-center rounded-xl border-[1.5px] border-(--c) text-(--c)">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {paths[id]}
      </svg>
    </span>
  )
}
