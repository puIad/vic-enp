import type { Cta } from '../lib/opening'

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  )
}

/** "Applications open 25 Oct" with the countdown chip, then "Apply" with the round gradient arrow (#10, #11). */
export function ApplyPill({ cta, className = '', inert }: { cta: Cta; className?: string; inert?: boolean }) {
  return (
    <a className={`pill ${cta.open ? 'is-open' : ''} ${className}`} href={cta.href} inert={inert}>
      {cta.open ? (
        <>
          {cta.label}
          <span className="go">
            <Arrow />
          </span>
        </>
      ) : (
        <>
          {cta.label}
          <span className="chip">
            <span className="sr-only">in </span>
            {cta.chip}
          </span>
        </>
      )}
    </a>
  )
}
