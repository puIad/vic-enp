import { Fragment, type CSSProperties } from 'react'
import { textOf, wordsOf, type Part } from '../lib/scrub'

// The word scrub (GLOSSARY.md, #36): a block of copy whose words light one by one with scroll. A screen reader gets
// each block whole from a visually hidden copy; the lit words beside it are hidden from it, so it never reads them one
// at a time. Both are real DOM text. Only staged pages render these: tier 0 and reduced motion keep the plain copy.

/** The copy as a visitor reads it without the scrub: the bold runs in `<b>`. */
export function Plain({ parts, bold }: { parts: Part[]; bold?: string }) {
  return parts.map((p, i) => (typeof p === 'string' ? <Fragment key={i}>{p}</Fragment> : <b key={i} className={bold}>{p.b}</b>))
}

/**
 * The copy scrubbed: word i starts to light at `starts[i]` of its block's progress (--sk). `read={false}` leaves out
 * the reader's copy, for a parent that gives one for several lines at once (the motto). `pair={false}` lets the last
 * two words part, for a heading, which balances its lines instead.
 */
export function Words({ parts, starts, bold, read = true, pair = true }: { parts: Part[]; starts: number[]; bold?: string; read?: boolean; pair?: boolean }) {
  const words = wordsOf(parts)
  const word = (i: number) => {
    const { w, bold: b } = words[i]
    return (
      <span key={i} className="sw" style={{ '--a': starts[i].toFixed(4) } as CSSProperties}>
        {b ? <b className={bold}>{w}</b> : w}
      </span>
    )
  }
  // the last two words travel together, as a paragraph's do (lib/orphans.ts)
  const tail = pair ? Math.max(0, words.length - 2) : words.length
  const spaced = (from: number, to: number) => words.slice(from, to).flatMap((_, j) => (j ? [' ', word(from + j)] : [word(from + j)]))
  const lit = (
    <>
      {spaced(0, tail)}
      {pair && tail > 0 && ' '}
      {pair && <span className="whitespace-nowrap">{spaced(tail, words.length)}</span>}
    </>
  )
  if (!read) return lit
  return (
    <>
      <span className="sr-only">{parts.map(textOf).join('')}</span>
      <span aria-hidden="true">{lit}</span>
    </>
  )
}
