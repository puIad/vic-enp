# Experience

How the page feels and moves: the 3D world, the visitor's journey, the feeling curve, the one moment people
remember, and the signature move. Planned with the `scroll-craft` method (its BRIEF, journey, grammar, feeling
curve, score and fingerprint gate), built in React Three Fiber.

Everything below marked **proposed** is Claude's draft for the owner to accept, change or replace once the
inspirations in [inspiration.md](inspiration.md) are in. Nothing here is decided until it is in
[decisions.md](decisions.md).

## The scroll-craft interview

The eight questions scroll-craft asks before planning. Answers are the owner's words where given.

| # | Question | Status | Answer |
|---|---|---|---|
| 1 | Vibe in three to five words, plus up to three references from any medium (film, album, game, shop; not websites) | Open (owner) | Proposed: "bright, ambitious, warm, made by students". References: the owner's inspiration list. |
| 2 | The scroll journey, section by section, in the owner's words | Proposed | [The journey](#the-journey) below. |
| 3 | The energy curve: where calm, where intense | Proposed | Intense open, calm explanation, a rising middle, the peak in club life, calm reassurance, a warm close. |
| 4 | How someone should feel stage by stage, and the ONE moment they remember | Proposed | [Feeling curve](#feeling-curve) and [the peak](#the-peak). |
| 5 | One thing this site does that no site they've seen does | Open (owner) | Proposed seed: "Every dot of light is a real VICer, and at the end one of them is you." |
| 6 | How far from premium-minimal (brutalist, maximalist, playful, retro, dense, editorial, premium-minimal) | Open (owner) | Proposed: playful-premium. Bold charter colour and big Gilroy type, generous space, motion with weight. |
| 7 | One unbroken world, or distinct scenes? | Open (owner) | Proposed: one world that **re-forms** per section, without a continuous camera flight. See [grammar](#grammar). |
| 8 | Assets already owned | Answered | 17 photos in `assets/pics/` (mostly group photos), the charter PDF, logo files, Gilroy. See [assets.md](assets.md). |

The tell-someone sentence (proposed): **"It's the site where 600 dots of light turn into the real club photo,
and then one of them is you."**

## The 3D world: three concepts

The charter forbids a 3D logo or using its bulb and iris as shapes ([brand.md](brand.md#logo-in-a-3d-world)), so
the world has to be original. Three candidates, from the source brief's own suggestions (§12) and the club's real
events. The owner picks one after the inspiration round.

### A. The network of 600 (recommended)

A field of 600 points of light, one per member (§11: 600 members), in the charter gradient. The field
**re-forms** as the visitor scrolls: a loose constellation in the hero, four clusters for the main departments,
three for the activity departments, a dense crowd that resolves into a real VIC group photo, the rings of event
identities (gold for the Gala, red for Ignite), and finally a network again, now with one new point: the visitor.

- **Why it fits.** It's the club's own idea ("Your network is your net worth", "Once a VICer, Always a VICer"),
  it uses a real number, and it carries the real photos instead of competing with them.
- **Signature move.** "Your point": the visitor's pointer or finger carries one point of light the whole way down.
  The network leans towards it and links to it. Pressing Apply sends that point into the network.
- **Cost.** Procedural: no 3D models to make or download. GPU points with a custom shader, morph targets
  between formations computed once. The photo formation samples a photo's pixels into points (around 20k to 40k
  on desktop, fewer on phones). Cheapest of the three to build and to run.
- **Risk.** Particle fields are common on the web; the bar is the formations being meaningful (each one says
  something true) and the photo resolve being genuinely good.

### B. The glass maze (Polymaze)

The visitor descends into a maze seen from above, like the line-follower mazes of Polymaze (photos `IMG_0257`
and `IMG_8026` are of it). Each turn opens a chamber: a department, club life, an event. The exit is the Apply
door. "Find your path."

- **Why it fits.** A real VIC event, a strong visual (the source brief suggests it for a 3D hero), and a
  natural way to say "four doors, pick yours".
- **Signature move.** A small robot (original model, not the logo) follows the visitor's scroll through the maze
  and stops at the department they hover.
- **Cost.** Modelled scene (maze, robot, materials), camera path, baked lighting. Heaviest to build in six days
  and to download (models plus textures). Close to a continuous camera flight, which scroll-craft warns is the most
  fragile structure.
- **Risk.** A maze can read as "confusing" for a recruitment page, and it centres SPARK over the other six
  departments.

### C. Light and glass

Abstract glass forms that bend light into the charter gradient (blue to aquamarine). As the visitor scrolls the
light splits into the colours of the departments and events. Vision (light) and Innovation (making), without
touching the logo's shapes.

- **Why it fits.** The most premium-looking, closest to the charter's own gradients.
- **Signature move.** The pointer is a light source; the glass refracts it.
- **Cost.** Transmission materials and an environment map; heavy on phone GPUs (transmission renders the scene
  twice). Needs careful tiering.
- **Risk.** Has to stay well clear of anything that reads as a bulb or an iris (charter rule), and abstract glass
  says little about what the club does.

### Comparison

| | A. Network of 600 | B. Glass maze | C. Light and glass |
|---|---|---|---|
| Says something true about VIC | Strong (members, network, photos) | Medium (one event) | Weak (abstract) |
| Uses the real photos | Built in (photo resolve) | Separate section | Separate section |
| Build time in 6 days | Fits | Tight to not fitting | Fits, tuning-heavy |
| Download on a phone | Smallest (procedural) | Largest (models, textures) | Medium (env map) |
| Phone GPU cost | Low to medium, scales by point count | Medium | High (transmission) |
| Charter risk | Low | Low | Medium (bulb or iris look) |

Concepts can mix: B's maze could be one formation of A (the points trace a maze for the SPARK and Polymaze
moments) instead of a whole world.

## The journey

Proposed beats, each a shift in what the visitor knows or feels. Sections serve beats; a section that serves no
beat gets cut.

| # | Beat | The visitor... | Sections ([content.md](content.md)) |
|---|---|---|---|
| 1 | Arrival | ...sees something they've never seen on a club page, and the club's name. | Hero |
| 2 | Recognition | ...learns this is a real club of 600 ENP students, since 2014. | What VIC is, Numbers |
| 3 | Range | ...sees the two homes they could have: a main department and an activity department. | Why join, Main departments, Activity departments |
| 4 | Proof | ...sees the people, the places and the events. It's real. | Club life (photo sequence), Events |
| 5 | Reassurance | ...learns it's open to them, now, with no experience. | How to join, Grow after joining, FAQ |
| 6 | Commitment | ...presses Apply. | Final CTA, footer |

## Grammar

scroll-craft names eight page grammars. Proposed: **continuous world** for the 3D layer (one persistent world
that re-forms) combined with the **chaptered** rhythm for the content (each beat a chapter with its own device),
so the page is one place without being one camera flight. Its rules hold: at least four device families, never the
same device twice in a row, at most two video-weight acts, one peak with the largest span.

Concept B would push towards a filmic one-shot (a camera path), which scroll-craft asks to justify against the
other seven grammars.

## Feeling curve

Proposed, written before the score so each act has a reason. Two adjacent acts never carry the same feeling.

| Act | Feeling | What on screen causes it |
|---|---|---|
| Hero | Wonder | The field of light moves under the visitor's hand; the name sits in it. |
| What VIC is | Curiosity | The field settles; three plain sentences and the four numbers land. |
| Departments | Agency | Four clusters, then three: tapping one brings it forward, and it's theirs to pick. |
| Club life | Belonging (the peak) | The crowd of points resolves into a real VIC group photo, then the photo sequence. |
| Events | Pride, ambition | The world takes the colour of each event (Gala gold, Ignite red); scale shifts up. |
| How to join, FAQ | Calm, trust | The world goes quiet and far; plain steps and answers in the foreground. |
| Close | Warm resolve | The network returns with the visitor's point in it; one button. |

## The peak

Proposed: **the resolve.** Hundreds of points that have been abstract the whole way down rush together and become
a real photo of VIC members, faces and all, and hold still long enough to look. Said by a visitor: "the dots
turned into the actual club." It lives in Club life, gets the longest span on the page, and the act before it
(Departments) is quieter so the resolve lands.

## Score (proposed)

Device names are scroll-craft's (`scrub`, `pin`, `pan`, `reveal`, `kinetic`, `parallax`, `count`, `flow`, pointer,
`drift`), plus the 3D state the world is in for each act.

| Act | Device | 3D world state | Why this device |
|---|---|---|---|
| Hero | pointer + `parallax` | Loose constellation following the pointer; name and tagline between depth planes | The page responds before anything is read |
| What VIC is | `kinetic` + `count` | Field settles into a slow drift | Type that assembles, numbers that land: facts, not spectacle |
| Main departments | `pin` + pointer | Four clusters, the active one forward | The frame holds while the choice advances |
| Activity departments | `pan` | Three clusters travelling sideways, in their own colours | Lateral travel reads as options |
| Club life (peak) | `pin` (long) then `reveal` | Points resolve into a group photo, then hand over to the photo sequence | The largest span, the stillest frame |
| Events | `drift` + `parallax` | World recoloured per event, larger scale | Movement with weight, different from the acts around it |
| How to join, FAQ | `flow` | World far back and dim | Reading time; motion steps aside |
| Close | pointer + `reveal` | Network with the visitor's point; Apply sends it in | The page ends by responding to them |

Checks before building: the fingerprint gate (the plan must differ from every row in scroll-craft's
`FINGERPRINTS.md` on at least four of six dimensions; the registry is empty for this workspace, so this build sets
the first row), and the device rules above.

## The photo sequence

The owner's ask: the photos appear in a scroll-driven section, each in its own way. Proposal:

- Seven to nine photos in the sequence (picked in [assets.md](assets.md#photos)), the rest in a closing mosaic.
- No two neighbours use the same entrance. A pool to pick from: resolve from points (the first, as the peak);
  a mask that opens from the centre; a slow pan across a wide group shot; a split where two photos slide apart to
  reveal a third; a depth stack where photos fly in from far back; a stacked deck the scroll deals out; a
  horizontal strip that travels sideways.
- Each photo carries one short caption with the event or place, only where the owner confirms what it shows.
- The portrait photo (`IMG_9072`, a night scene) gets a portrait-first moment on phones.
- Reduced motion: the photos sit in a still, art-directed grid, same captions.

## Motion rules

- Scroll drives everything, damped (Lenis). One speed for the whole page, slower than feels natural while
  building.
- Never trap the scroll: no section that needs a gesture to escape, keyboard and screen readers move normally,
  anchor links work.
- The CTA is always one tap away: a sticky pill after the hero, out of the way of the content.
- Text never moves while it's being read. It arrives, then holds.
- Pointer and touch reactions are a bonus, never required to read anything.
- No sound by default. (Open question if the owner wants an optional sound toggle.)
- `prefers-reduced-motion`: Lenis off, no scrubbed transitions, the 3D world becomes still compositions per
  section, the photo sequence becomes a grid.

## Phones first

Most visitors are on a phone in portrait, inside Instagram's browser. Each act is composed for 390×844 on its
own, not squeezed from desktop: the world's formations are taller than wide, type sits in the top or bottom
third, clusters stack instead of spreading. Fewer points, lower resolution, the same story. Device tiers are in
[architecture.md](architecture.md#device-tiers).

## Before and after opening

- Before 25 Oct (opening time to confirm): the hero shows "Applications open in 5d 12h" with a live countdown, and
  the CTA reads "Applications open 25 Oct" and links to `@vic.enp` on Instagram.
- From the opening: the countdown is gone and every CTA reads Apply and opens `APPLY_URL`.
- The switch happens in the browser by date, so no redeploy is needed at midnight. The date and time live in one
  config value.
