# Experience

How the page feels and moves: the direction, the 3D world, the visitor's journey, the feeling curve, the peak and
the signature move, then the spec of each act. Planned with the `scroll-craft` method, built in React Three Fiber.

This is the signed spec. Every act was comped and signed off by the owner on 2026-10-19 on the wayfinder map
([issue #1](https://github.com/puIad/vic-enp/issues/1)); each act below gives the essentials and links its ticket,
which holds the full spec (layout numbers, timings, shots). The comps are throwaway HTML and three.js on
never-merged branches: learn from them, port them, never merge them. Decisions are dated in
[decisions.md](decisions.md).

## The scroll-craft interview

| # | Question | Answer | Where settled |
|---|---|---|---|
| 1 | Vibe | **Dark, cinematic, electric**: charter blue and aquamarine glowing against Dark Jungle Green `#141E27`. | [#6](https://github.com/puIad/vic-enp/issues/6) |
| 2 | The journey | [Seven acts](#the-journey) | [#9](https://github.com/puIad/vic-enp/issues/9) |
| 3 | The energy curve | Wonder, recognition, agency, then the peak (belonging), excitement, calm trust, warm resolve | [#9](https://github.com/puIad/vic-enp/issues/9) |
| 4 | Feeling stage by stage, and the one moment | [Feeling curve](#the-journey) and [the peak](#the-peak) | [#9](https://github.com/puIad/vic-enp/issues/9) |
| 5 | The one thing no other site does | **Your point**: the visitor's own point of light travels down the page with them and flies into the Apply pill at the close. | [#6](https://github.com/puIad/vic-enp/issues/6), [#17](https://github.com/puIad/vic-enp/issues/17) |
| 6 | Distance from premium-minimal | **The middle**: a premium dark base, with dense, dramatic acts (full-screen scenes, heavy light and particles). | [#6](https://github.com/puIad/vic-enp/issues/6) |
| 7 | One world or distinct scenes | **One world at two speeds** ([grammar](#grammar-one-world-two-speeds)) | [#9](https://github.com/puIad/vic-enp/issues/9) |
| 8 | Assets already owned | 17 photos in `assets/pics/`, the charter PDF, logo files, Gilroy ([assets.md](assets.md)) | |

The belief the page installs: **"Once you are a VICer, you are always a VICer, and I can be one this season."**
([brief.md](brief.md#what-the-visitor-should-believe-by-the-end))

The tell-someone sentence: **"It's the site where 600 dots of light turn into the real club photo, and then one
of them is you."**

## The direction: a named merge, A as the page

Three directions were comped ([#7](https://github.com/puIad/vic-enp/issues/7)); the owner merged them
([#8](https://github.com/puIad/vic-enp/issues/8), comps on
[`prototype/directions`](https://github.com/puIad/vic-enp/tree/prototype/directions/prototype/directions)):

- **A, Constellation map, is the page.** One continuous world of 600 points, one per member (brief §11). The
  waypoint rail, the headline over the field, the "Distance to the 600" readout, the change of scale as hand-over,
  the peak (the crowd resolves into the group photo in front of ENP) and the close (your point flies into the
  empty place in the Apply pill).
- **B, Cutlist, runs the departments and the events.** Short hard cuts, one Gilroy Heavy line per cut, a
  formation per cut that snaps instead of morphing, accents only inside their own cut.
- **C, Thresholds, gives the passages.** The door, the tunnel and the horizon are how the page moves between A's
  speed and B's.
- Not carried over: B's loud full-width bar, C's chaptered editorial layout and margin folio.

The world is the network of 600 (concept A in the first draft). The glass maze and light-and-glass concepts were
not chosen; nothing modelled, no glass, no transmission.

## Grammar: one world, two speeds

The page is one continuous world of points the whole way down: one WebGL context, no chapters or headings over it
([#9](https://github.com/puIad/vic-enp/issues/9)).

- **A's speed:** the field morphs slowly and lingers (hero, what VIC is, the peak, the light act's night ends,
  the close).
- **B's speed:** the same points snap into a new formation on every cut, no morph, a one or two frame white flash,
  and the ground steps hard between night and a lifted tint (departments, events).
- **Passages:** C's door, tunnel and horizon switch between the speeds. Each is used once. No passage may read
  as a dark disc around a lit point: the iris belongs to the hero and the close
  ([brand.md](brand.md#logo-in-a-3d-world)).

Because the cuts are the same world snapping, this is not a chaptered page with a world underneath (which
scroll-craft bans), and it is the cheapest option on a phone: no scene is disposed and rebuilt.

## The journey

Seven acts. Two neighbours never share a feeling or a device family. The peak is the largest act by a clear
margin, and the tunnel before it is quiet. The page lands near 22 to 24 screens on a phone.

| # | Act | Content ([content.md](content.md)) | Speed | Feeling | Device | Span (approx.) | Spec |
|---|---|---|---|---|---|---|---|
| 1 | Hero | 1 | A | Wonder | pointer + `parallax` | 0.7 screen of hand-over (170 svh) | [#11](https://github.com/puIad/vic-enp/issues/11) |
| 2 | What VIC is, numbers, why join | 2, 3, 4 | A | Recognition | `kinetic` + `count`, then `flow` | 3.5 phone, 3 desktop | [#12](https://github.com/puIad/vic-enp/issues/12) |
| | *Door* | | C | | | 0.6 | [#13](https://github.com/puIad/vic-enp/issues/13) |
| 3 | Departments: 4 main, then 3 activity | 5, 6 | B, 7 cuts | Agency | `pin`, a snap per cut, + pointer | 4.55 (0.65 per cut) | [#13](https://github.com/puIad/vic-enp/issues/13) |
| | *Tunnel*: dim, wordless, the silence before the peak | | C | | | 0.6 | [#13](https://github.com/puIad/vic-enp/issues/13) |
| 4 | **Club life and photos (the peak)** | 7 | A | **Belonging** | `pin` for the resolve, then a depth stack | **about 6** | [#14](https://github.com/puIad/vic-enp/issues/14) |
| | *Hard cut*: the resolved photo cuts straight into the first event | | B | | | | [#14](https://github.com/puIad/vic-enp/issues/14) |
| 5 | Events and projects | 8 | B, 5 cuts | Excitement | `pin` with a sideways cut per event | 3.0 | [#15](https://github.com/puIad/vic-enp/issues/15) |
| | *Horizon in*: the night lifts into Bright Gray | | C | | | 0.46 desktop, 0.34 phone (measured) | [#16](https://github.com/puIad/vic-enp/issues/16) |
| 6 | How to join, grow after joining, FAQ | 9, 10, 12 | the light act | Calm trust | `flow` | 3.4 desktop, 4.2 phone with both horizons | [#16](https://github.com/puIad/vic-enp/issues/16) |
| | *Horizon out*: gray falls back to night | | C | | | as above | [#16](https://github.com/puIad/vic-enp/issues/16) |
| 7 | Close and footer | 13 | A | Warm resolve | pointer + `reveal`, pinned | 1.3 after a half-screen entry (230 svh) | [#17](https://github.com/puIad/vic-enp/issues/17) |

Testimonials (content section 11) stay cut until real quotes arrive.

## The peak

**The resolve.** The crowd of points rushes together into the group photo in front of ENP (`IMG_8658`) and holds
still long enough to look. Then ten more photos arrive in a depth stack, each in its own way, and the ENP photo
returns full frame before a hard cut to the first event ([#14](https://github.com/puIad/vic-enp/issues/14)).

## The signature move: your point

The visitor's own point of light: its own sprite, aquamarine glow with a white core, lit in the iris of the icon
formation when "Gathering the 600" reaches 600 in the hero. It is the one thing on screen that never cuts.

- Hero: held in the icon's iris while the icon holds, moving only as the icon leans. Across the hero's hand-over
  it drifts out to its fixed spot top right and grows 35%.
- Act 2: fixed on screen top right, outside the cloud. It never leans, drifts or parallaxes.
- Departments, peak, events: fixed in the world, still, off to one side (bottom right on desktop, top right on
  phones). It grows 55% across the peak.
- The light act: the horizon line carries it up and away; it relights with one pulse on the way out.
- The close: it swoops from top right along a curve with a light trail into an empty slot in the Apply pill,
  ringed by an iris of the 600 (the iris slot).
  Pressing Apply (after opening) sends a wave of light through the 600.

How it moves from top right to bottom right on desktop between act 2 and the departments is not specified by the
comps; the build settles it ([open-questions.md](open-questions.md), row 28).

## Fingerprint

The plan's row for scroll-craft's fingerprint registry (empty for this workspace, so this is the first row):

| Grammar | Nav | Hero | Act sequence | Close | Signature |
|---|---|---|---|---|---|
| One continuous world at two speeds, with three passages | Waypoint rail with a sub-dot per cut, opened by hover or a hold, landing in the footer; no menu | Headline beside the VIC icon drawn by the 600, your point lit in its iris; it loosens into a tilted cloud on scroll | 7 acts, 2 cut runs (7 and 5 cuts), 3 passages, 1 hard cut | Your point flies into a slot in the Apply pill ringed by an iris of the 600 | Your point |

## The acts

Shared by every act: Gilroy Heavy, Bold and Regular; night `#141E27` except the light act; static grain and
vignette over canvas and photos; the waypoint rail as navigation and progress; the Apply pill from the second
waypoint; the logo on its own night plate ([brand.md](brand.md),
[#10](https://github.com/puIad/vic-enp/issues/10), comp on
[`prototype/system`](https://github.com/puIad/vic-enp/tree/prototype/system/prototype/system)). Copy for every act
is in [content.md](content.md).

### 1. Hero

[#11](https://github.com/puIad/vic-enp/issues/11), comp
[`prototype/act-hero`](https://github.com/puIad/vic-enp/tree/prototype/act-hero/prototype/act-hero). The icon
formation was added on 2026-10-20 ([ADR 0001](adr/0001-the-icon-formation.md)) and has no comp: the comp shows the cloud, which is where
the hero goes on scroll.

- **World:** 600 member points (larger, up to 7 px) plus dust: 9,000 points desktop, 5,000 phone. Slow idle drift.
  - At rest, the icon formation: the 600 draw the VIC icon, bulb and iris, from `vic-icon.svg`, tilted like the
    cloud and coloured with the logo's gradient (`#69C4AF` to `#127DBB`). The dust stays loose around it, blue far,
    aquamarine near.
  - On scroll, the cloud: loose, tilted, three arms with a dense core, so it never reads as a ring with a bright
    centre. Blue far, aquamarine near.
- **Layout:** desktop, copy bottom left at the rail gutter, headline capped at 128 px; the icon sits whole in the
  right two thirds, clear of the headline, and the cloud after it fills the same area. Phone, the icon fills the
  field in the top 40%, copy in the bottom 60%, headline 52 px.
- **Arrival:** night, then the words (HTML, first paint), then the 600 stream in over 3.2 s and land on the icon
  while "Gathering the 600" climbs; at 600 the counter fades and your point lights in the iris. The icon holds
  until the first scroll.
- **Scroll:** over 0.7 screen the headline lifts and fades, the icon loosens into the cloud as the camera dollies
  into the field, the field tightens 38%, your point drifts out of the iris to top right, and the sticky pill
  appears at 92%.
- **Pointer:** the field leans toward the pointer or a held finger and swings by depth. Bonus only.
- **Hand-over:** A to A, no passage. Act 2's first line arrives into the cleared left side.

### 2. What VIC is, the numbers, why join

[#12](https://github.com/puIad/vic-enp/issues/12), comp
[`prototype/act-what-vic`](https://github.com/puIad/vic-enp/tree/prototype/act-what-vic/prototype/act-what-vic).

- **Pinned span, 2 screens:** the title and three sentences scrub in word by word (the
  [word scrub](../GLOSSARY.md)); at about 56% they fade and the four numbers rise. The values line left the page on
  2026-10-20 ([decisions.md](decisions.md), 54). Counters run once over 1.5 s and never reset; when 600
  lands the member points pulse once from the centre.
- **Flow, about 1.3 screens (2 on a phone):** "What you get." and ten benefits in three groups, items rising in
  once.
- **World:** the hero's field, tightened and far, keeps turning slowly with scroll. Dims to 50% under the
  benefits, back to full before the door.
- **Layout:** numbers as a four-column row under gradient hairlines on desktop, a 2x2 grid on a phone.
- **Slice 5 ([plan](build-plan.md#slice-5-polish-and-launch), group 3):** the word scrub and the dim are built
  ([#36](https://github.com/puIad/vic-enp/issues/36)): the four numbers rise one after another from 58% and are all
  in place by 94%, so the pin never holds still. The counters and the pulse are built
  ([#37](https://github.com/puIad/vic-enp/issues/37)): each number counts from when it starts to rise (the year from
  2000, as in the comp), and the pulse is the Apply wave's ring, sized to the cloud and run from its centre.

### 3. Departments

[#13](https://github.com/puIad/vic-enp/issues/13), comp
[`prototype/act-departments`](https://github.com/puIad/vic-enp/tree/prototype/act-departments/prototype/act-departments).

- **Device:** one pinned stage, a hard cut per department: HR, FLER, IT, COMM, then SPARK, Training, English
  Bubble. Entered through the door, left through the tunnel.
- **Each cut:** the department's name in its accent with a short rule, one Heavy line peeling in with a three-step
  chromatic split, a lead, IT's "Design and media, not coding" pill (the only pill), a "Suits" line (main four
  only) and a "What you'd do" button. Eyebrows and skill pills were cut on 2026-10-20 ([decisions.md](decisions.md), 43, 44).
- **Slice 5 ([owner's notes](build-plan.md#the-owners-notes-2026-10-20), items 9 to 11):** the activity
  departments get logo formations (each logo's symbol), IT's grid becomes a painting palette, and English Bubble's
  points morph into the tunnel within the existing scroll instead of a hard cut. SPARK carries no photo
  ([decisions.md](decisions.md), 59, 61, 65, 67).
- **World:** 16k points desktop, 10k phone. Each cut snaps every point into the department's formation (HR six
  joined clumps, FLER rising bars, IT a painting palette, COMM broadcast rings, SPARK an orange burst, Training ascending
  treads, English Bubble two open speech circles). The main four use blue and aquamarine; only the three activity
  departments carry their own accents.
- **Pointer:** the formation leans toward the pointer; a tap on the cluster or the button opens "What you'd do" in
  place (`aria-expanded`). A picker row jumps to any cut; the rail grows one tick per cut.
- **Reduced motion:** cuts stack as normal sections. **Tier 0:** seven outlined cards, everything open.

### 4. Club life and the photo sequence (the peak)

[#14](https://github.com/puIad/vic-enp/issues/14), comp
[`prototype/act-peak`](https://github.com/puIad/vic-enp/tree/prototype/act-peak/prototype/act-peak).

- **Span about 6 screens:** resolve about 2, hold about 0.7, sequence about 3.3.
- **Resolve:** from the tunnel's dim galaxy, the camera comes in while the points (12k phone, 24k desktop) rush
  into a sampled copy of `IMG_8658`. The real photo fades in under them and only then rounds its corners. The hold
  has no text and nothing moves.
- **Sequence:** ten photos in a depth stack, no two neighbours with the same entrance, at most two stack planes
  on screen at once on a phone:

| # | Photo | Entrance |
|---|---|---|
| 1 | `IMG_8658` group in front of ENP | resolves from the points |
| 2 | `IMG_0645` forest group | slit opens from the centre line |
| 3 | `IMG_6171` group indoors with robot cars | tilt: swings open on its left edge, like a door |
| 4 | `IMG_2757` full hall, speakers on stage | pan from the left 60% out to the whole hall |
| 5 | `IMG_9072` night courtyard (portrait) | rises from below with a slight rotation; the phone's portrait moment |
| 6 | `IMG_7517` group on the steps, a certificate held up | iris: a circle opens from the middle of the group |
| 7 | `IMG_9159` night selfie | lens pull back from 2x |
| 8 | `IMG_8641` bottle rocket lifted overhead | split: two halves close in from the sides |
| 9 | `IMG_9215-2` large group in a hall | wipe: a diagonal edge sweeps in from the right |
| 10 | `IMG_7544` banner around the table | dealt from a pile, lower right |
| 11 | `IMG_8759` outdoor group | flies in from far back |

- **Copy:** the title and lead over the points, then a four-row ledger of club life, one row lit at a time. No
  captions, alt text only.
- **Hand-over:** the ENP photo returns full frame, then a hard cut (no passage, no fade) to the Gala cut.
- **Tier 0 and reduced motion:** one art-directed grid of the same eleven photos.
- **Slice 5 ([owner's notes](build-plan.md#the-owners-notes-2026-10-20)):** `IMG_6171`, `IMG_7517` and `IMG_9215-2` join the stack, ten photos in
  the same six screens, and the tier 0 grid (built). VIC Entertainment's row gets its logo's symbol. VIC Charity's row has
  left the ledger (built) ([decisions.md](decisions.md), 55, 60, 65).

### 5. Events and projects

[#15](https://github.com/puIad/vic-enp/issues/15), comp
[`prototype/act-events`](https://github.com/puIad/vic-enp/tree/prototype/act-events/prototype/act-events).

- **Device:** one pinned stage, five sideways hard cuts, photo-led: Gala 0.7, Ignite 0.55, Polymaze 0.55, AEC 0.5,
  four more projects 0.7. An event-coloured streak sweeps over each cut; each photo pans slowly inside its frame.
- **Cut line is the event's own name.** No edition numbers, no dates. Hour of Code is not on the page.
- **Colour:** Gala gold `#D4A843`, Ignite red `#E0313F`, only inside their cut. Polymaze, AEC and the projects use
  aquamarine.
- **World:** snaps per cut: tiered seat arcs (Gala), eleven rising columns (Ignite), a maze path with a lit runner
  (Polymaze), six city clusters (AEC), four small rings (projects), then the flat line of the horizon.
- **Photos:** `DSCF7405` (Gala), `_T2A6297` (Ignite), `IMG_8026` (Polymaze), `IMG_3223` (AEC, 2026-10-20). The
  four projects have none ([assets.md](assets.md#missing)).
- **Copy (2026-10-20):** the name, a lead and a link to the event's own site (gala, ignite, polymaze and
  aec.vic-enp.com). No eyebrow, no pills ([decisions.md](decisions.md), 43 to 49, 57).
- **Slice 5 ([owner's notes](build-plan.md#the-owners-notes-2026-10-20), items 14 and 17):** each event's logo
  formation (AEC's symbol; GALA, Ignite and POLYMAZE draw their names), left above its name on desktop with the
  formation kept behind the photo, the logo alone on a phone; the projects' logo symbols beside their names; every
  event's name at the same height on every cut; ignite, polymaze and aec links; `IMG_0257` as a second frame in
  POLYMAZE's cut (built: beside the first on desktop, about 2:1 across the frame's width, shorter and level with its
  top; on a phone the two share the frame's height 2:1; the tier 0 card's 16:9 row splits the same way)
  ([decisions.md](decisions.md), 56, 57, 59, 60, 65).
- **Tier 0:** a two-column card grid. **Reduced motion:** cuts stack.

### 6. How to join, grow after joining, FAQ (the light act)

[#16](https://github.com/puIad/vic-enp/issues/16), comp
[`prototype/act-join-faq`](https://github.com/puIad/vic-enp/tree/prototype/act-join-faq/prototype/act-join-faq).

- **Ground:** Bright Gray `#EFEFEF`, entered and left through the horizon. The only light act on the page.
- **Horizon in:** the field lies down into the lit horizon line and becomes it; the line carries your point up
  and away. Under the gray nothing is rendered (the render loop idles).
- **Device `flow`:** ordinary reading scroll, no pin, no snap. Blocks reveal once.
- **Steps:** four, as ghost numerals on a hairline your point walks (left to right on desktop, top to bottom on a
  phone). **Growth:** a six-rung staircase. **FAQ:** nine hairline rows, real buttons, first row open, arrow keys
  move between questions.
- **Horizon out:** the line rises, the field stands back up as night returns, and your point relights with one
  pulse.
- **Slice 5 ([plan](build-plan.md#slice-5-polish-and-launch), group 4):** the walking point and the one-time reveals, not built in slices 1 to 4.

### 7. Close and footer

[#17](https://github.com/puIad/vic-enp/issues/17), comp
[`prototype/act-close`](https://github.com/puIad/vic-enp/tree/prototype/act-close/prototype/act-close).

- **Stage:** centred, the only centred act. Headline "Your point is on its way.", then the Apply pill (64 px high,
  19 px label) with an empty 40 px slot at its left, set in a clearing of the 600 about 36 px wider than the pill
  on desktop. The iris slot, added on 2026-10-20 with no comp ([ADR 0001](adr/0001-the-icon-formation.md)): the 600 ring the slot as an
  iris, so your point lights in an iris at the start and lands in one at the end. Slice 4 settles the ring's size
  against the pill.
- **Travel:** headline wipes up, the clearing opens, the pill rises, the readout counts to 0.0, your point swoops
  into the slot and breathes there.
- **The Apply moment (after opening):** your point flares, a wave of light runs through the 600 from the slot,
  then `APPLY_URL` opens. Modified clicks skip it. Before opening the pill is the countdown linking to `@vic.enp`.
- **Footer:** opaque night, no canvas under it. Opens on the rail, landed as "Jump back to"
  ([below](#the-rail-lands-in-the-footer)). Ends on the motto at 128 px. No description line, and the address
  reads "10 Rue des Frères OUDEK, El Harrach" ([decisions.md](decisions.md), 58). The motto has the word scrub
  ([owner's notes](build-plan.md#the-owners-notes-2026-10-20), item 19; [decisions.md](decisions.md), 62; built in
  [#36](https://github.com/puIad/vic-enp/issues/36)), whole by the bottom of the page.

## Passages

| Passage | Where | State | Span |
|---|---|---|---|
| Door | act 2 to departments | two slabs of points with a lit slit, aquamarine, wordless | 0.6 |
| Tunnel | departments to the peak | a tube of points receding, dimmed to 40%, wordless | 0.6 |
| Horizon | events to the light act and back, light act to the close | a CSS gradient with a 1 px lit line; the field lies down into it and stands back up | 0.46 desktop, 0.34 phone each way |

## Motion rules

- Scroll drives everything, damped (Lenis). One speed for the whole page, except where [the catch](#the-catch)
  stops a fast fling on a cut or an act.
- Never trap the scroll: no section needs a gesture to escape, keyboard and screen readers move normally, anchor
  links work (the rail is real anchor links). The catch is no trap: every new gesture moves on, and jumps and keys
  are never caught.
- The Apply pill is one tap away from the second waypoint (top right on desktop, bottom right on phones), hidden
  in the hero and at the close, where their own CTA takes over.
- Text never moves while it's being read. It arrives, then holds.
- Pointer and touch reactions are a bonus, never required to read anything. Native cursor, no custom cursor.
- No sound: the optional toggle was dropped ([decisions.md](decisions.md), 84).
- No full-screen loader: "Gathering the 600" under the hero headline is the loader.
- Slice 5 adds a tap ripple through the 600 on phones and moving grain on tiers 1 and 2, still on tier 0, under
  reduced motion and on the world's lowest rung ([decisions.md](decisions.md), 64).
- The tap ripple is built ([#38](https://github.com/puIad/vic-enp/issues/38)): a short, still tap sends one soft ring
  from the finger that lights the points it passes and nudges them outward, fading in about 0.9 s. One ring at a
  time: a tap while the Apply wave, the 600's landing or another tap runs is let go.

## Reading and wayfinding

Added on 2026-10-21 ([decisions.md](decisions.md), 68 to 78). Testers skimmed past whole acts, the departments most
of all, and didn't realize the rail's dots link back. Slice 5's group 4 builds it
([build-plan.md](build-plan.md#slice-5-polish-and-launch)). The rail and its footer landing are built in [#59](https://github.com/puIad/vic-enp/issues/59).

### The catch

- **What it does:** a fast fling on a phone, or a fast wheel burst, that would carry the visitor past a catch point
  glides to rest on it in about 0.4 s. A slow scroll crosses freely. It works down and up alike. No control and no
  cue: the cut's own entrance and the rail already show where you are.
- **Catch points (16):** the 12 cuts, each at its middle (where the pickers jump); the top of act 2; the peak's
  hold, the resolved group photo; the top of the light act; the close at rest, your point in its slot. Steps,
  Growth and FAQ are not catch points.
- **One gesture, one point:** the point you rest on never catches you again, so every new gesture moves on.
- **Insisting:** the third swipe in a row, each starting within about 0.25 s after the previous one came to rest, passes
  the rest of a run (the departments or the events); the still sections (act 2's top, the peak, the light act, the
  close) still stop it, and swiping on quickly skips each further run. A flick made during the glide (on a mouse, a new
  spin) moves exactly one more point. A swipe that has been fast keeps catching while it coasts, down to about 600 px/s
  ([decisions.md](decisions.md), 80 to 82).
- **Never caught:** jumps from the rail, the pickers, the skip link or any anchor; keyboard scrolling; the reload
  restore.
- **Off** under reduced motion and on tier 0, where nothing is pinned. `?catch=off` turns it off to compare.
- **How:** on the wheel, inside Lenis's `virtualScroll` hook; on touch, by watching the page coast after the finger lifts
  and gliding back to a point it coasts across, so phones keep native momentum
  ([architecture.md](architecture.md#scroll-to-world); [decisions.md](decisions.md), 83).
  What counts as fast, and the insist window, are tuned on the owner's phones. The phone half ships only if it
  feels right inside Instagram ([open-questions.md](open-questions.md), 30); otherwise phones launch with free
  scroll and desktop keeps its catch.

### The rail

- **Sub-dots:** smaller dots under their act for the 7 departments, the 5 events (GALA, Ignite, POLYMAZE, AEC, the
  projects) and the light act's Steps, Growth and FAQ. The current act's sub-dots show as ticks, as the runs' ticks
  do today.
- **Name flashes:** entering an act or a sub-section, its name shows beside its dot for about 2 s, then the rail is
  dots again. Entering a run, the act's flash names its first cut with it ("Departments · HR"). Desktop keeps the
  current act's name on, as now.
- **Hover (desktop):** every name and every sub-dot shows, each a link. Keyboard focus on the rail shows every name
  the same way.
- **Hold (phones):** about 0.4 s on the rail, a ring filling under the finger, opens it over a dark scrim with every
  name. Slide and release on a name, or lift and tap one, to jump; tap away or scroll to close. The rows share the
  screen's height, an act's row twice a sub-section's, and the row under the finger lights before release, so a
  slide picks exactly even on a short phone. A plain tap on a dot still jumps. The rail shows no iOS or Android
  press menu.
- **Targets:** on phones the act dots sit 44 px apart and each tap area fills its pitch
  ([quality.md](quality.md#accessibility)).
- **Keyboard and screen readers:** sub-dots stay out of the tab order. The pickers and the footer list reach every
  sub-section.
- **Jumps land** where the pickers do: a cut at its middle, an act or a block at its top.
- The department and event pickers stay.

### The rail lands in the footer

- The footer opens on "Jump back to": every act and sub-section, labelled, on the rail's dots and line and on the
  rail's x. The fixed rail fades as it arrives. The motto stays the page's last line.
- The first time the list arrives in a visit, the fixed rail acts out its hold once before it fades: the ring fills
  around its dot, the rail opens with every name for about a second, then closes. Desktop opens it the same way,
  without the ring. No text hint.

## Tiers and reduced motion

Budgets are tier 1 from [#5](https://github.com/puIad/vic-enp/issues/5): DPR cap 1.5 on phones and 2 on desktop,
points only, scene fog, CSS grain and vignette, no bloom, glass, volumetrics or depth of field. Point counts per
act are in each act above. Tiers are in [architecture.md](architecture.md#device-tiers).

- **Tier 0** (no WebGL, Save-Data, `deviceMemory` at most 2, context lost) and **reduced motion** share one
  composition per act: no canvas, a baked poster of the same scene, all copy and controls visible, nothing pinned
  or scrubbed. The department and event acts give tier 0 cards; reduced motion with WebGL on stacks their cuts.

## Phones first

Most visitors are on a phone in portrait, inside Instagram's browser. Each act is composed for 390x844 on its own:
the field sits in the top 40% with type below, formations are scaled down, the rail shows dots (names flash as you
enter, and a hold opens it), the pill sits bottom right. Fewer points, the same story.

## Before and after opening

- Before `OPENS_AT`: every CTA reads "Applications open 25 Oct" with a live countdown chip ("5d 12h", then
  "9h 05m" in the last day) and links to `@vic.enp` on Instagram. The close has no sub line.
- From `OPENS_AT`: every CTA reads "Apply" with a round gradient arrow and opens `APPLY_URL`; the close shows its
  sub line and the Apply wave.
- The switch happens in the browser by date, so no redeploy is needed. The date lives in one config value.
