import { useEffect, useRef, useState } from 'react'
import type { Pad } from '../lib/pad'

// The optional sound toggle (#10, #41; decisions.md, 28, 63 and 84), bottom left as in the prototype/system comp.
// Off on arrival and never on by itself: the audio context and the pad's code load on the first click. The pad
// follows the visitor's place on the rail (`act` and `sub`, as Chrome works them out), so scrolling back up plays the chords back. A hidden tab pauses it.

export function SoundToggle({ act, sub, lit }: { act: number; sub: number; lit: boolean }) {
  const [on, setOn] = useState(false)
  const ctx = useRef<AudioContext | null>(null)
  const pad = useRef<Pad | null>(null)
  const want = useRef(false)
  const here = useRef({ act, sub })

  useEffect(() => {
    const from = here.current
    here.current = { act, sub }
    pad.current?.go(from, here.current)
  }, [act, sub])

  useEffect(() => {
    if (!on) return
    const onVis = () => void (document.hidden ? ctx.current?.suspend() : ctx.current?.resume())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [on])

  useEffect(() => () => void ctx.current?.close(), [])

  const toggle = () => {
    want.current = !on
    setOn(!on)
    if (!want.current) {
      pad.current?.stop()
      pad.current = null
      setTimeout(() => !want.current && ctx.current?.suspend(), 1000)
      return
    }
    // made and resumed inside the click, so every browser counts it as the visitor's own
    const c = (ctx.current ??= new AudioContext())
    void c.resume()
    void import('../lib/pad').then(({ Pad }) => {
      if (want.current && !pad.current) pad.current = new Pad(c, here.current)
    })
  }

  return (
    <button type="button" className={`sound ${lit ? 'lit' : ''}`} aria-label="Sound" aria-pressed={on} onClick={toggle}>
      <span className="bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="lbl">{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
