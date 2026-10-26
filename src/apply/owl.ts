// /apply's owl post (owner, 26 Oct): on "Send by owl" the candidate's letter folds in thirds and goes into an envelope,
// the flap closes and the wax drops in their house's colour, then the painted owl swoops in, grabs it and beats away into
// the night. A send that did not land brings the owl back to set the letter down before the form returns. Web Animations
// only, no library; tier 0 and reduced motion see the owl still, holding the letter. form.ts decides when; this file
// only moves the owl.

const sky = () => document.querySelector('.ap-owl-sky') as HTMLElement
const q = <T extends Element = HTMLElement>(sel: string) => sky().querySelector(sel) as T

const still = () => document.documentElement.dataset.tier === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches
const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms))
/** an animation's end, or its cancel: either way the sequence goes on */
const end = (a: Animation) => a.finished.then(
  () => undefined,
  () => undefined,
)
const hold: KeyframeAnimationOptions = { fill: 'forwards' }

let wings: Animation[] = []

/** the wings beat while the owl flies, and fold still once it is gone */
function beat(on: boolean) {
  for (const w of wings) w.cancel()
  wings = []
  if (!on) return
  for (const [sel, turn] of [
    ['.ap-owl-wing.is-l', -34],
    ['.ap-owl-wing.is-r', 34],
  ] as const)
    wings.push(
      q(sel).animate([{ transform: 'none' }, { transform: `rotate(${turn}deg) scaleY(0.93)` }], {
        duration: 190,
        direction: 'alternate',
        iterations: Infinity,
        easing: 'cubic-bezier(.45,0,.55,1)',
      }),
    )
}

/** back to the start: no animation left over from an earlier send, the sheet unfolded, the owl away */
function reset() {
  beat(false)
  for (const a of sky().getAnimations({ subtree: true })) a.cancel()
  sky().classList.remove('is-shut', 'is-grabbed', 'is-held')
}

/** The letter folds, is sealed, and the owl takes it away. Resolves once the owl is out of sight. */
export async function postLetter(): Promise<void> {
  reset()
  if (still()) {
    sky().classList.add('is-held')
    return sleep(600)
  }
  const sheet = q('.ap-post-sheet')
  const rig = q('.ap-owl-rig')

  // 1: the letter, folded in thirds, top down in front and bottom up behind
  await end(sheet.animate([{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out', ...hold }))
  const top = q('.ap-post-third.is-top').animate([{ transform: 'none' }, { transform: 'rotateX(-176deg)' }], { duration: 360, easing: 'cubic-bezier(.6,0,.3,1)', ...hold })
  await sleep(150)
  const bot = q('.ap-post-third.is-bot').animate([{ transform: 'none' }, { transform: 'rotateX(176deg)' }], { duration: 360, easing: 'cubic-bezier(.6,0,.3,1)', ...hold })
  await Promise.all([end(top), end(bot)])

  // 2: into the envelope (apply.css --post-drop), the flap shuts over it and the wax drops
  const drop = getComputedStyle(sheet).getPropertyValue('--post-drop').trim()
  await end(sheet.animate([{ transform: 'none' }, { transform: `translateY(${drop})` }], { duration: 380, easing: 'cubic-bezier(.5,0,.25,1)', ...hold }))
  const flap = q('.ap-post > .ap-env-flap').animate([{ transform: 'rotateX(180deg)' }, { transform: 'rotateX(0deg)' }], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)', ...hold })
  await sleep(150)
  sky().classList.add('is-shut')
  await end(flap)
  await end(
    q('.ap-post > .ap-post-seal').animate(
      [
        { opacity: 0, transform: 'translate(-50%,-50%) scale(1.8)' },
        { opacity: 1, transform: 'translate(-50%,-50%) scale(.9)', offset: 0.7 },
        { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
      ],
      { duration: 320, easing: 'ease-out', ...hold },
    ),
  )

  // 3: the owl swoops down out of the night, wings beating as it nears
  beat(true)
  await end(
    rig.animate(
      [
        { opacity: 0, transform: 'translate(-62vw,-42vh) scale(.2) rotate(-14deg)' },
        { opacity: 1, offset: 0.15 },
        { transform: 'translate(-18vw,-9vh) scale(.72) rotate(-7deg)', offset: 0.6 },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 900, easing: 'cubic-bezier(.3,.1,.3,1)', ...hold },
    ),
  )

  // 4: talons on the letter, a dip under its weight, and away up into the night
  sky().classList.add('is-grabbed')
  await end(rig.animate([{ transform: 'none' }, { transform: 'translateY(9px)' }, { transform: 'none' }], { duration: 200, easing: 'ease-in-out' }))
  await end(
    rig.animate(
      [
        { opacity: 1, transform: 'none' },
        { transform: 'translate(5vw,-11vh) scale(.9) rotate(5deg)', offset: 0.35 },
        { opacity: 1, transform: 'translate(62vw,-56vh) scale(.16) rotate(12deg)', offset: 0.9 },
        { opacity: 0, transform: 'translate(68vw,-62vh) scale(.12) rotate(12deg)' },
      ],
      { duration: 1100, easing: 'cubic-bezier(.45,0,.8,.5)', ...hold },
    ),
  )
  beat(false)
}

/** The send did not land: the owl brings the letter back and sets it down, then leaves. */
export async function returnLetter(): Promise<void> {
  if (still()) return
  const rig = q('.ap-owl-rig')
  for (const a of rig.getAnimations()) a.cancel()
  sky().classList.add('is-grabbed')
  beat(true)
  await end(
    rig.animate(
      [
        { opacity: 0, transform: 'translate(62vw,-52vh) scale(.18) rotate(12deg)' },
        { opacity: 1, offset: 0.15 },
        { transform: 'translate(14vw,-8vh) scale(.82) rotate(5deg)', offset: 0.6 },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 850, easing: 'cubic-bezier(.3,.1,.3,1)', ...hold },
    ),
  )
  sky().classList.remove('is-grabbed')
  await end(
    rig.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translate(-60vw,-46vh) scale(.2) rotate(-12deg)' },
      ],
      { duration: 800, easing: 'cubic-bezier(.5,0,.8,.4)', ...hold },
    ),
  )
  beat(false)
  await sleep(250)
}
