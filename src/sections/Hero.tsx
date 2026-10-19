import { ApplyPill } from '../components/ApplyPill'
import type { Cta } from '../lib/opening'

// Act 1 (#11), tier 0: copy bottom left at the rail gutter, the cloud on the right two thirds behind it.
export function Hero({ cta }: { cta: Cta }) {
  return (
    <section id="top" aria-labelledby="h-hero" className="wrap grid min-h-svh content-end pt-[40svh] pb-[14svh] md:pt-36 md:pb-[12vh]">
      <h1 id="h-hero" className="t-display max-w-[8ch] md:max-w-[11.5ch]">
        Engineer more than your degree.
      </h1>
      <p className="t-lead mt-6 text-gray md:mt-[26px]">
        <b className="font-bold text-white">Vision &amp; Innovation Club.</b> A nonprofit, English-speaking scientific club at ENP.
      </p>
      <div id="hero-cta" className="mt-7 flex md:mt-[34px]">
        <ApplyPill cta={cta} className="pill-lg" />
      </div>
      <p className="t-cap mt-[18px]">Since 2014 · Once a VICer, always a VICer.</p>
    </section>
  )
}
