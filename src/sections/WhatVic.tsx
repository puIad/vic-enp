// Act 2 (#12), tier 0: the final state of the pinned span as normal flow, then the benefits.

const NUMBERS: { figure: string; caption?: string; plus?: true; since?: true }[] = [
  { figure: '600', caption: 'members' },
  { figure: '40', plus: true, caption: 'trainings a year' },
  { figure: '10', plus: true, caption: 'major events' },
  { figure: '2014', since: true },
]

export function WhatVic() {
  return (
    <section id="the-600" aria-labelledby="h-600" className="wrap pt-[18svh] pb-24 md:pt-[22vh] md:pb-32">
      <div className="max-w-[34rem]">
        <h2 id="h-600" className="t-act max-w-[14ch]">
          Run by ENP students, for ENP students.
        </h2>
        <div className="t-lead mt-7 space-y-4 text-gray">
          <p>
            <b className="font-bold text-white">VIC</b> is an English-speaking scientific club at École Nationale Polytechnique d'Alger, a branch of
            the El-Maarifa Scientific Association.
          </p>
          <p>
            <b className="font-bold text-white">Our mission:</b> help members and ENP students build soft and hard skills and a network, through events that are genuinely enjoyable.
          </p>
          <p>
            <b className="font-bold text-white">Our vision:</b> a lasting community you are proud to belong to.
          </p>
        </div>
      </div>

      <ul className="mt-20 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-28 md:grid-cols-4 md:gap-0">
        {NUMBERS.map((n) => (
          <li
            key={n.figure}
            className="relative border-t border-(--line) pt-4 before:absolute before:-top-px before:left-0 before:h-px before:w-full before:bg-(image:--grad) before:shadow-[0_0_10px_rgb(105_196_175/.55)] md:pt-[22px] md:pr-5"
          >
            <p className="tab flex items-baseline gap-2 text-(length:--t-figure) leading-none font-black tracking-[-0.03em] text-white">
              {n.since && <small className="text-[.3em] font-bold tracking-normal text-aqua">since</small>}
              {n.figure}
              {n.plus && <span className="-ml-1.5 text-aqua">+</span>}
            </p>
            {n.caption && <p className="t-cap mt-2.5 max-w-[20ch] max-md:text-xs">{n.caption}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

const GROUPS = [
  {
    name: 'Lead early',
    items: [
      ['Real responsibility, early', 'Organize large events with corporate guests, sponsors and hundreds of attendees.'],
      ['Organizing-team experience', "Work on the club's projects and events."],
      ['A path to leadership', 'Active members can become Project Managers, Department Heads, or run for President.'],
      ['A voice', 'Propose ideas to the committee and vote in elections.'],
    ],
  },
  {
    name: 'Grow your skills',
    items: [
      ['Free internal trainings', 'Technical and soft skills.'],
      ['Two homes in the club', 'One main department for your work, one activity department for your learning.'],
      ['Certificates', 'A membership certificate, plus event certificates for organizing teams.'],
    ],
  },
  {
    name: 'Belong for good',
    items: [
      ['A network', 'Sponsors, industry leaders, alumni and members from every ENP specialty.'],
      ['The Local', "The club's headquarters at ENP. Every VICer is welcome, without exception."],
      ['A lifelong community', 'Graduates stay in VIC as alumni.'],
    ],
  },
]

export function WhyJoin() {
  return (
    <section aria-labelledby="h-get" className="wrap pt-16 pb-36 md:pt-24 md:pb-48">
      <h2 id="h-get" className="t-act">
        What you get.
      </h2>
      <div className="mt-12 grid max-w-[1180px] gap-12 md:mt-16 md:grid-cols-3 md:gap-10">
        {GROUPS.map((g) => (
          <section key={g.name} aria-labelledby={`g-${g.name}`}>
            <h3 id={`g-${g.name}`} className="relative border-b border-(--line) pb-3 text-[clamp(22px,1.9vw,27px)] leading-tight font-black tracking-[-0.015em] text-white">
              {g.name}
              <span aria-hidden="true" className="absolute -bottom-px left-0 h-px w-10 bg-(image:--grad) shadow-[0_0_8px_rgb(105_196_175/.6)]" />
            </h3>
            <ul>
              {g.items.map(([b, p]) => (
                <li key={b} className="border-b border-(--line) py-4">
                  <b className="block text-[15px] font-bold text-white">{b}</b>
                  <p className="mt-1 text-[15px] leading-normal text-mute">{p}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
