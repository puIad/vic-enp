import { ApplyPill } from '../components/ApplyPill'
import type { Cta } from '../lib/opening'
import { TIER } from '../world/boot'

// Act 1 (#11): copy bottom left at the rail gutter, the cloud on the right two thirds behind it. On tier 1 and 2 the
// world is the loader: "Gathering the 600" sits under the icon's place, and on a load at the top the copy waits until
// your point lights (world/arrival.ts), then rises in; it lifts away on the hand-over.
export function Hero({ cta }: { cta: Cta }) {
  return (
    <section id="top" aria-labelledby="h-hero" data-sc-act="flow" className="wrap grid min-h-svh content-end pt-[40svh] pb-[14svh] md:pt-36 md:pb-[12vh]">
      <h1 id="h-hero" className="t-display max-w-[8ch] md:max-w-[11.5ch]">
        Engineer more than your degree.
      </h1>
      <p className="t-lead mt-6 text-gray md:mt-[26px]">
        <b className="font-bold text-white">Vision &amp; Innovation Club.</b>
      </p>
      <div id="hero-cta" className="mt-7 flex md:mt-[34px]">
        <ApplyPill cta={cta} className="pill-lg" />
      </div>
      {TIER > 0 && (
        <p id="gather" className="gather" aria-hidden="true">
          Gathering the 600 <b id="gather-n">0</b>
        </p>
      )}
    </section>
  )
}
