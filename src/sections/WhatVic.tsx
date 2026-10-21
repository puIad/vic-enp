import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { Plain, Words } from '../components/Scrub'
import { COUNT_MS, countAt } from '../lib/count'
import { world } from '../world/store'
import { act2Progress, startsByBlock, wordStarts, wordsOf, type Part } from '../lib/scrub'
import { useScrub } from '../lib/useScrub'

// Act 2 (#12). Tier 0 and reduced motion: the final state of the pinned span as normal flow, then the benefits. With
// the world (#36): two screens pinned, where the title and three sentences light word by word (the word scrub), then
// fade at about 56% as the numbers rise one after another. The timing runs on --sk, the act's progress (index.css).

// `from`: where a staged counter starts (#37); the year counts up from 2000, as in the comp
const NUMBERS: { figure: string; from: number; caption?: string; plus?: true; since?: true }[] = [
  { figure: '600', from: 0, caption: 'members' },
  { figure: '40', from: 0, plus: true, caption: 'trainings a year' },
  { figure: '10', from: 0, plus: true, caption: 'major events' },
  { figure: '2014', from: 2000, since: true },
]

const TITLE: Part[] = ['Run by ENP students, for ENP students.']
const SENTENCES: Part[][] = [
  [{ b: 'VIC' }, " is an English-speaking scientific club at École Nationale Polytechnique d'Alger, a branch of the El-Maarifa Scientific Association."],
  [{ b: 'Our mission:' }, ' help members and ENP students build soft and hard skills and a network, through events that are genuinely enjoyable.'],
  [{ b: 'Our vision:' }, ' a lasting community you are proud to belong to.'],
]
const BOLD = 'font-bold text-white'

// The comp's timing (prototype/act-what-vic): the title lights from 5%, the sentences from 17%, all lit by 56% when
// the copy fades. Each number rises over 12% from 58%, 8% apart, the last whole by 94%, so the pin never holds still.
const LIT_BY = 0.56
const TITLE_AT = wordStarts(wordsOf(TITLE).length, 0.05, 0.19)
const SENT_AT = startsByBlock(SENTENCES, 0.17, 0.51)
const NUM_AT = NUMBERS.map((_, i) => 0.58 + i * 0.08)

const RISE = 0.12
/** The stage's timings, handed to index.css so the verify state below and the CSS can't drift apart. */
const TIMING = { '--lit-by': LIT_BY, '--rise': RISE } as CSSProperties

const act2At = (el: HTMLElement) => act2Progress(scrollY, el.getBoundingClientRect().top + scrollY, el.offsetHeight, innerHeight)
// what is on screen, for shoot.mjs: how many words have lit, the fade, and each number's rise in quarters
const act2State = (k: number) =>
  [
    `words ${[...TITLE_AT, ...SENT_AT.flat()].filter((a) => k > a).length}`,
    k >= LIT_BY ? 'faded' : 'shown',
    `numbers ${NUM_AT.map((a) => Math.round(Math.min(1, Math.max(0, (k - a) / RISE)) * 4)).join('')}`,
  ].join(', ')

function Numbers({ staged }: { staged: boolean }) {
  return (
    <ul className={`a2-nums grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-0 ${staged ? 'staged self-center md:self-end' : 'mt-20 md:mt-28'}`}>
      {NUMBERS.map((n, i) => (
        <li
          key={n.figure}
          style={staged ? ({ '--a': NUM_AT[i] } as CSSProperties) : undefined}
          className="relative border-t border-(--line) pt-4 before:absolute before:-top-px before:left-0 before:h-px before:w-full before:bg-(image:--grad) before:shadow-[0_0_10px_rgb(105_196_175/.55)] md:pt-[22px] md:pr-5"
        >
          <p className="tab flex items-baseline gap-2 text-(length:--t-figure) leading-none font-black tracking-[-0.03em] text-white">
            {n.since && <small className="text-[.3em] font-bold tracking-normal text-aqua">since</small>}{' '}
            {staged ? (
              // the figure holds its width while a copy hidden from screen readers counts up over it (index.css)
              <span className="relative">
                <span className="a2-final">{n.figure}</span>
                <span aria-hidden="true" className="a2-count absolute top-0 left-0">{n.from}</span>
              </span>
            ) : (
              n.figure
            )}
            {n.plus && <span className="a2-plus -ml-1.5 text-aqua">+</span>}
          </p>
          {n.caption && <p className="t-cap mt-2.5 max-w-[20ch] max-md:text-xs">{n.caption}</p>}
        </li>
      ))}
    </ul>
  )
}

/** The room the pinned stage leaves above and below the copy: the top bar's clearance (.a2-stage's padding-top) and a
 *  little air under it. */
const CLEAR = 126

/**
 * Whether act 2's copy fits on one pinned screen. Its height depends on the width only, so on a short screen (a phone
 * held sideways, a 1280x600 laptop window) the title and sentences can outgrow the stage; act 2 then flows as on tier
 * 0, all lit. The still and staged copy blocks share their width and type, so either one measures it.
 */
function useFits(copy: RefObject<HTMLDivElement | null>) {
  const [fits, setFits] = useState(true)
  useEffect(() => {
    const el = copy.current
    if (!el) return
    const check = () => setFits(el.offsetHeight + CLEAR <= innerHeight)
    const ro = new ResizeObserver(check)
    ro.observe(el)
    addEventListener('resize', check)
    check()
    return () => {
      ro.disconnect()
      removeEventListener('resize', check)
    }
  })
  return fits
}

/**
 * The counters (decisions.md, 63): each number counts up once over 1.5 s from when it starts to rise, then shows its
 * figure (and its plus) for good; when the 600 lands, the member points pulse once from the centre (World). The starts
 * outlive the stage, so a resize that drops it and brings it back never recounts or pulses again.
 */
function useCounters(pin: RefObject<HTMLDivElement | null>, staged: boolean) {
  const started = useRef(NUMBERS.map(() => -1))
  const pulsed = useRef(false)
  useEffect(() => {
    const el = pin.current
    if (!staged || !el) return
    const items = [...el.querySelectorAll<HTMLElement>('.a2-nums > li')]
    let raf = 0
    const tick = () => {
      raf = 0
      const now = performance.now()
      items.forEach((li, i) => {
        const at = started.current[i]
        if (at < 0 || 'counted' in li.dataset) return
        const ms = now - at
        li.querySelector('.a2-count')!.textContent = String(countAt(NUMBERS[i].from, +NUMBERS[i].figure, ms))
        if (ms < COUNT_MS) raf ||= requestAnimationFrame(tick)
        else {
          li.dataset.counted = ''
          if (i === 0 && !pulsed.current) {
            pulsed.current = true
            world.members = now
          }
        }
      })
    }
    const update = () => {
      const k = act2At(el)
      NUM_AT.forEach((a, i) => {
        if (started.current[i] < 0 && k >= a) started.current[i] = performance.now()
      })
      if (!raf) tick()
    }
    update()
    world.listeners.add(update)
    return () => {
      world.listeners.delete(update)
      cancelAnimationFrame(raf)
    }
  }, [pin, staged])
}

export function WhatVic({ staged: withWorld = false }: { staged?: boolean }) {
  const pin = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const staged = useFits(copy) && withWorld
  useScrub(pin, staged, act2At, act2State)
  useCounters(pin, staged)

  if (!staged)
    return (
      <section id="the-600" aria-labelledby="h-600" className="wrap pt-[18svh] pb-24 md:pt-[22vh] md:pb-32">
        <div ref={copy} className="max-w-[34rem]">
          <h2 id="h-600" className="t-act max-w-[14ch]">
            <Plain parts={TITLE} />
          </h2>
          <div className="t-lead mt-7 space-y-4 text-gray">
            {SENTENCES.map((s, i) => (
              <p key={i}>
                <Plain parts={s} bold={BOLD} />
              </p>
            ))}
          </div>
        </div>
        <Numbers staged={false} />
      </section>
    )
  return (
    <section id="the-600" aria-labelledby="h-600" className="relative z-[2]">
      <div ref={pin} className="a2-pin" style={TIMING} data-sc-act="pin">
        <div className="a2-stage wrap" data-sc-stage>
          <div ref={copy} className="a2-text max-w-[34rem]">
            <h2 id="h-600" className="a2-title t-act max-w-[14ch]">
              <Words parts={TITLE} starts={TITLE_AT} pair={false} />
            </h2>
            <div className="a2-sent t-lead mt-7 space-y-4 text-gray">
              {SENTENCES.map((s, i) => (
                <p key={i}>
                  <Words parts={s} starts={SENT_AT[i]} bold={BOLD} />
                </p>
              ))}
            </div>
          </div>
          <Numbers staged />
        </div>
      </div>
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
    <section id="benefits" aria-labelledby="h-get" className="wrap pt-16 pb-36 md:pt-24 md:pb-48">
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
