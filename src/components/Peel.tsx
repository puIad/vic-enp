import { Fragment, type CSSProperties } from 'react'

/** A name with its ® set small and raised (Ignite® Algiers). */
export function Mark({ text }: { text: string }) {
  const i = text.indexOf('®')
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <sup className="reg">®</sup>
      {text.slice(i + 1)}
    </>
  )
}

/** A headline that peels in word by word when its cut lands (the cut's own chromatic split is CSS). */
export function Peel({ text }: { text: string }) {
  return text.split(' ').map((w, i) => (
    <Fragment key={i}>
      {i > 0 && ' '}
      <span className="w">
        <span style={{ '--i': i } as CSSProperties}>
          <Mark text={w} />
        </span>
      </span>
    </Fragment>
  ))
}
