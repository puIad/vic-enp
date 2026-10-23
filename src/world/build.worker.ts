import { build, type BuildIn } from './build'

// The formations built ahead (World's warm-up, decision 95), off the main thread: on a phone the event logos alone took
// over 100 ms each, a frame the page and the finger's scroll stood still for (#43). The points go back transferred.

onmessage = (e: MessageEvent<{ in: BuildIn }>) => {
  const fm = build(e.data.in)
  postMessage({ fm }, { transfer: [fm.pos.buffer, fm.col.buffer] })
}
