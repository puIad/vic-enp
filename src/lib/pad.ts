import type { Spot } from './rail'
import { chimeAt, chordAt } from './sound'

// The sound toggle's pad (#41), played live with Web Audio: no file, nothing fetched. Loaded only when the visitor
// turns the sound on (SoundToggle imports it then). Each chord fades in over the last one, so a scroll back up
// crossfades back; a cut that lands rings one soft chime. No beat anywhere: the only movement is a slow swell of the
// filter.

const LEVEL = 0.5 // the pad's master gain once faded in
const VOICE = 0.035 // each oscillator's gain: 8 of them under a low-pass
const CHIME = 0.06
const FADE_IN = 2.5 // s, on turning the sound on
const XFADE = 0.6 // s, the time constant of a chord's crossfade (about 2 s to settle)
const DETUNE = 7 // cents, the two oscillators of a voice either side of the note

type Layer = { gain: GainNode; oscs: OscillatorNode[] }

/** A stereo impulse of decaying noise: a soft room for the pad and the chime, generated, not fetched. */
function room(ctx: AudioContext, seconds: number) {
  const n = Math.round(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3
  }
  return buf
}

export class Pad {
  private out: GainNode
  private tone: BiquadFilterNode
  private wet: ConvolverNode
  private swell: OscillatorNode
  private layer: Layer | null = null
  private fading: Layer[] = []
  private notes = ''
  private lastChime = 0
  private ctx: AudioContext

  constructor(ctx: AudioContext, at: Spot) {
    this.ctx = ctx
    const t = ctx.currentTime
    this.out = ctx.createGain()
    this.out.gain.setValueAtTime(0, t)
    this.out.gain.linearRampToValueAtTime(LEVEL, t + FADE_IN)
    this.out.connect(ctx.destination)

    this.wet = ctx.createConvolver()
    this.wet.buffer = room(ctx, 3.5)
    const send = ctx.createGain()
    send.gain.value = 0.45
    this.wet.connect(send).connect(this.out)

    this.tone = ctx.createBiquadFilter()
    this.tone.type = 'lowpass'
    this.tone.frequency.value = 620
    this.tone.Q.value = 0.5
    this.tone.connect(this.out)
    this.tone.connect(this.wet)

    // the filter opens and closes over about 20 s
    this.swell = ctx.createOscillator()
    this.swell.frequency.value = 0.05
    const depth = ctx.createGain()
    depth.gain.value = 220
    this.swell.connect(depth).connect(this.tone.frequency)
    this.swell.start()

    this.chord(chordAt(at))
  }

  /** The visitor moved: the chord of the new place, and a chime if a cut landed. */
  go(from: Spot, to: Spot) {
    this.chord(chordAt(to))
    const f = chimeAt(from, to)
    if (f) this.chime(f)
  }

  /** Fades out, then lets everything go. */
  stop() {
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(this.out.gain.value, t)
    this.out.gain.setTargetAtTime(0, t, 0.15)
    setTimeout(() => {
      for (const l of [this.layer, ...this.fading]) l?.oscs.forEach((o) => o.stop())
      this.swell.stop()
      this.out.disconnect()
    }, 1000)
  }

  private chord(freqs: number[]) {
    const key = freqs.join()
    if (key === this.notes) return
    this.notes = key
    const t = this.ctx.currentTime
    if (this.layer) {
      const old = this.layer
      old.gain.gain.cancelScheduledValues(t)
      old.gain.gain.setValueAtTime(old.gain.gain.value, t)
      old.gain.gain.setTargetAtTime(0, t, XFADE)
      old.oscs.forEach((o) => o.stop(t + XFADE * 6))
      this.fading.push(old)
      old.oscs[0].onended = () => (this.fading = this.fading.filter((l) => l !== old))
      // a fast fling through a run: never more than two chords fading at once
      while (this.fading.length > 2) this.fading.shift()!.oscs.forEach((o) => o.stop())
    }
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, t)
    gain.gain.setTargetAtTime(1, t, XFADE)
    gain.connect(this.tone)
    const oscs = freqs.flatMap((f) =>
      [-DETUNE, DETUNE].map((cents) => {
        const o = this.ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        o.detune.value = cents
        const v = this.ctx.createGain()
        v.gain.value = VOICE
        o.connect(v).connect(gain)
        o.start(t)
        return o
      }),
    )
    this.layer = { gain, oscs }
  }

  private chime(f: number) {
    const t = this.ctx.currentTime
    if (t - this.lastChime < 0.15) return
    this.lastChime = t
    const env = this.ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(CHIME, t + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
    env.connect(this.out)
    env.connect(this.wet)
    // a bell: the note and a quieter, slightly sharp octave
    for (const [ratio, level] of [
      [1, 1],
      [2.01, 0.3],
    ]) {
      const o = this.ctx.createOscillator()
      o.frequency.value = f * ratio
      const g = this.ctx.createGain()
      g.gain.value = level
      o.connect(g).connect(env)
      o.start(t)
      o.stop(t + 2.5)
    }
  }
}
