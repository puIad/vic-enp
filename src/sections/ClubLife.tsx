// Act 4, the peak (#14), tier 0 without photos yet: title and lead, then the five-row ledger as a plain list.
// shortcut: the art-directed grid of the eight photos joins this act in slice 2 (scripts/photos.mjs); no placeholders until then.

const LEDGER = [
  ['VIC Entertainment', "At least two community activities a month, built from members' own ideas."],
  ['The Local', "VIC's headquarters inside ENP, a gathering place for every VICer."],
  ['General assemblies', 'The President keeps members updated on projects and progress.'],
  ['Charity', 'A school-supplies drive for students in need.'],
  ['Alumni', 'Graduates stay in the community and help with events.'],
]

export function ClubLife() {
  return (
    <section id="club-life" aria-labelledby="h-life" className="wrap pt-28 pb-32 md:pt-40 md:pb-44">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <h2 id="h-life" className="t-display max-w-[9ch]">
            Every VICer is welcome.
          </h2>
          <p className="t-lead mt-7 text-gray">Without exception. The Local, VIC's headquarters inside ENP, is a gathering place for all of them.</p>
        </div>
        <ol className="self-end lg:col-span-5 lg:col-start-8">
          {LEDGER.map(([name, text], i) => (
            <li key={name} className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-t border-(--line) py-5 last:border-b">
              <span aria-hidden="true" className="tab pt-0.5 text-[13px] text-aqua">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[19px] leading-tight font-bold text-white">{name}</h3>
                <p className="mt-1.5 text-[15px] leading-normal text-mute">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
