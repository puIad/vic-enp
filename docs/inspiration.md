# Inspiration

The references the direction was built from, chosen on the wayfinder map (2026-10-19), and what to take from each.
Research is on never-merged branches: [gallery references](https://github.com/puIad/vic-enp/blob/research/gallery-refs/research/gallery-refs/README.md)
([#2](https://github.com/puIad/vic-enp/issues/2)), [getlayers, 21st.dev and Originkit](https://github.com/puIad/vic-enp/blob/research/layers-21st-originkit/research/layers-21st-originkit/README.md)
([#3](https://github.com/puIad/vic-enp/issues/3)), [section patterns](https://github.com/puIad/vic-enp/blob/research/section-patterns/research/section-patterns/README.md)
([#4](https://github.com/puIad/vic-enp/issues/4)). The owner chose not to add picks from land-book, lapa.ninja,
godly or landingfolio (the first two blocked headless browsers, the last two had nothing usable).

## The world and the motion (anchors of the merged direction, [#7](https://github.com/puIad/vic-enp/issues/7))

| # | Reference | Feeds | What to take |
|---|---|---|---|
| 1 | [EnduroSat Space Service](https://www.endurosat.com/space-service/) | A, the whole page | One persistent dark scene, blue on navy, that still holds on a phone |
| 2 | [Edolus](https://edolus.com/) | A | One camera falling through scales; slow bands where copy is read |
| 3 | [Eventide](https://eventide.framer.ai/) | A, hero | The headline split around one luminous form; a live scroll-linked readout ("Distance to the 600") |
| 4 | [Lando Norris](https://landonorris.com/) | B, events | Captioned photos scattered at depth |
| 5 | [Nocturnal Dream](https://www.nocturnaldream.com/) | B, cut lines | Type as physical strips in the scene (the peel-in) |
| 6 | [Techoice](https://tedious-minotaur-807429.framer.app/) | B, cuts | The RGB-split edge on a hard cut (the three-step chromatic split) |
| 7 | [Fighter Ready](https://fighterready.com/) | C, passages | The hand-over as a walk through a door |
| 8 | [Vesper Cinematic](https://flowing-porcupine-450501.framer.app/) | C, type | Heavy geometric type with blue rim light on a dark field |
| 9 | [The Obsidian Assembly](https://obsidianassembly.com/) | C | Photos and large type together in a dark layout |
| 10 | Studio Archive (#2) | Peak | Photos on an object in space, not on a grid |

Recurring across the 17 gallery references: the camera as the scroll, near-black plus one accent, the branded
loader as the first scene, mono readouts, hand-overs by a physical thing, photos on objects instead of grids.

## Section patterns ([#4](https://github.com/puIad/vic-enp/issues/4))

Used for tier 0 and the content inside each act; all stack to one column on a phone.

| Section | Reference | What to take |
|---|---|---|
| Numbers | Railway, Neon | One big figure plus one caption, counted once |
| Departments | Webflow | Outlined icon, title, two lines, link (the tier 0 cards) |
| Events | Vercel Ship | A list with one swapping image |
| Photos | Next.js Conf | A single-tone strip of mixed heights |
| Steps | Neon | Ghost numerals |
| FAQ | Raycast | Hairline rows, first answer open |
| Close | Resend, Linear | One button over a huge wordmark |

## Code taken from a reference

Only one: Meng To's MIT [Gallery](https://21st.dev/@mengto/components/gallery) on 21st.dev, as the base of the
peak's depth stack ([#19](https://github.com/puIad/vic-enp/issues/19), [architecture.md](architecture.md#third-party-code)).
Everything else is ported from our own comps.

## In this workspace already

- `Projects/POLYMAZE Champions League/` has its own design system and page. Worth a look for the Polymaze cut.
- `VIC-Recruitment-2026/frontend/src/components/brand/` has the charter motifs already drawn for the dashboard
  (the divider disc, arches, outlined words, dot grid). They are 2D but carry the charter's shapes.

## Rules for using references

- A reference is something to learn from, never something to copy. No assets, models, shaders or code from a
  reference site go into the build unless their licence allows it and the source is noted in
  [assets.md](assets.md).
- Each reference that changes the plan gets a line in [decisions.md](decisions.md).
