import { Fragment, type CSSProperties } from 'react'

/** A headline that peels in word by word when its cut lands (the cut's own chromatic split is CSS). */
export function Peel({ text }: { text: string }) {
  return text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="w">
        <span style={{ '--i': i } as CSSProperties}>{w}</span>
      </span>
    </Fragment>
  ))
}
