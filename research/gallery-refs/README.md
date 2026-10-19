# Dark cinematic 3D references from the galleries

Resolves issue #2. Run on 2026-10-19. Question: which live sites are the strongest references for a dark, cinematic, premium, scroll-driven 3D landing page, and what is takeable from each.

17 references, ranked strongest first. Each one was opened in a browser and screenshotted. Where a site did not get past its loader in my run, the entry says so.

## How this was done, and its limits

- Galleries read: Awwwards (listing and site pages, fetched fine), Framer marketplace (template pages and live previews), Godly (the old `godly.website` now 301-redirects to `recent.design`, so I could not browse it, only use a Godly page that turned up in search), Lapa Ninja (3D category list read through a search snippet only). Land-book and Lapa Ninja answered with a Cloudflare challenge, both by plain fetch and in the browser. I did not try to get past it. Landingfolio's inspiration grid came back empty and its other pages are template shops. No reference from Land-book, Lapa Ninja or Landingfolio made the list: the two Lapa 3D picks I opened (World Labs) and one Godly pick (Cosmos) render as light pages, so they were dropped.
- Screenshots: Chrome for Testing, headless, software WebGL, Playwright. Desktop is 1440 by 900, phone is 390 by 844 (a viewport size only, not a real device). Software WebGL is slow, so heavy sites sat in their loader far longer than they would on a real phone. A loader frame is shown where that happened. "Holds up on a phone" below means "the 390 px render was coherent", not "it runs at 60 fps on a mid-range Android".
- File naming in `shots/`: `<slug>-d.jpg` desktop hero, `<slug>-s.jpg` desktop after about 3000 px of mouse-wheel scroll, `<slug>-m.jpg` phone. Not every site has all three.
- Visible tech comes from the Awwwards or template listing tags, plus what the rendered page showed. I did not open DevTools on each one.
- Awwwards scores and dates are as the listing pages stated them. "Nominee" means voting was still open.
- Nothing was signed into, accepted, downloaded or submitted. The only clicks were on a site's own "enter" gates.

## Ranked references

### 1. EnduroSat Space Service

- URL: https://www.endurosat.com/space-service/
- Source: Awwwards nominee, 19 Oct 2026 (Three.js, WebGL, GSAP, single page)
- Area: 3D world, hero, transitions
- Shots: `shots/endurosat-d.jpg`, `shots/endurosat-s.jpg`, `shots/endurosat-m.jpg`
- What to take: one dark scene that changes as you scroll. The hero is a blue wireframe satellite lit from the right over the rim of a planet, with a two-line heavy caps headline on the left. After scroll, the same star field holds while a dotted globe with a blue rim glow and thin blue streaks replaces the satellite, and the headline becomes a sentence sitting over it. Build it as one persistent R3F scene with a star layer that never unloads, and swap the hero object per scroll band. Small blue caps label above each headline.
- Tech: Three.js, WebGL, GSAP per listing.
- Phone: yes. The 390 px render keeps the satellite, re-sized and cropped at the right edge, with the headline stacked to three lines.
- Charter colours: yes, closest of the set. Navy-black ground, `#127DBB`-family blue as the only accent. Swap the planet rim for a cyan to aquamarine gradient.

### 2. Fighter Ready

- URL: https://fighterready.com/
- Source: Awwwards nominee, 17 Oct 2026 (3D, WebGL, GSAP, Three.js, scrolling)
- Area: transitions, 3D world, motion feel
- Shots: `shots/fighterready-d.jpg` (loader), `shots/fighterready-s.jpg`
- What to take: the scroll is a camera walk. After scrolling, the frame is a first-person view through open double doors into a dark gym corridor with the ring at the far end, orange light spilling in from the door edges. That is a hand-over between acts that is a physical passage, not a cross-fade: act one ends at a door, act two is the room behind it. The loader is branded and honest ("Lacing up", a percentage and a thin progress line). Sections are named in a top nav that highlights as you pass them.
- Tech: Three.js, WebGL, GSAP per listing.
- Phone: not confirmed. The 390 px render did not get past the loader in 45 s under software GL.
- Charter colours: structure yes, colour no (orange and black). Re-light the corridor in `#127DBB` and `#69C4AF`.

### 3. Eventide (Framer template)

- URL: https://eventide.framer.ai/ (listed at https://aidancreates.space/templates/eventide)
- Source: Framer template; listing says "free", the preview badge says "Buy template $123". Check before relying on it.
- Area: hero, 3D world, type in motion
- Shots: `shots/eventide-d.jpg`, `shots/eventide-s.jpg`, `shots/eventide-m.jpg`
- What to take: a black hole fills the hero, the headline is split across it ("Every agent." top left, "One gravity." bottom right), a mono caption reads "Scroll to cross the horizon", and a small live readout in the top right shows "Distance to horizon r = 20.00 rs". The readout is a scroll-linked number, cheap to build and it makes the scroll feel measured. After the dive the page drops to calm text blocks on near-black.
- Tech: real-time WebGL shader hero per listing; the page itself is Framer.
- Phone: yes. The black hole crops to its lower half under the headline and stays legible.
- Charter colours: swap the orange accretion disk for the cyan to aquamarine gradient. The ground is already near-black.

### 4. Vesper Cinematic (Framer template)

- URL: https://flowing-porcupine-450501.framer.app/ (listing: https://www.framer.com/marketplace/templates/vesper-cinematic/)
- Source: Framer marketplace, free
- Area: hero, type in motion
- Shots: `shots/vesper-d.jpg`, `shots/vesper-s.jpg`, `shots/vesper-m.jpg`
- What to take: a dark star-dust field with a single glass-like blob behind a huge wide geometric sans headline ("We build worlds beyond the dark"). The blob has a cool blue rim light. The type is the Gilroy kind of shape, so it is a fair stand-in for judging weight and spacing. The capabilities list scrolls as numbered rows with a blue underline that fills as each row passes.
- Tech: Framer with a 3D object and scroll-driven motion per listing.
- Phone: yes. Same hero, centred, with the blob behind the text.
- Charter colours: yes. Blue on near-black already.

### 5. Edolus

- URL: https://edolus.com/
- Source: Awwwards Site of the Day, 4 Oct 2026, per a write-up on dokle.design. I did not fetch the Awwwards page itself.
- Area: 3D world, motion feel, type in motion, close
- Shots: `shots/edolus-d.jpg` (loader), `shots/edolus-s.jpg`
- What to take: one camera, one direction, falling through scales (orbit, city, data centre, chip), with the copy matching each scale. The write-up says the scroll is a 32,000 px timeline with slowed bands where something needs to be read and a settle onto each chapter. Build that as a scroll map with per-act speed multipliers and a soft snap. The type: heavy tight sans titles, a mono face for specs that scrambles into place. In my run the start screen read "Initiate system" and "Experience with headphones", then the first scene (a lit rack in a dark hall) with a ghosted blurred word behind a large "NVX-72".
- Tech: PlayCanvas per the write-up, not Three.js.
- Phone: not confirmed. The 390 px render stayed on the 80 percent loader.
- Charter colours: structure yes. It is black with gold. Re-grade to blue and aquamarine.

### 6. Kinoria

- URL: https://kinoria.studio/
- Source: Awwwards nominee, 15 Oct 2026 (WebGL, Three.js, React). The desktop frame also shows a yellow corner ribbon that reads "of the day", so it may have since won.
- Area: photo entrances, 3D world, loader
- Shots: `shots/kinoria-d.jpg`, `shots/kinoria-s.jpg`, `shots/kinoria-m.jpg`
- What to take: the loader is a camera viewfinder (corner brackets, f 2.0 and 1/60 readouts, a shutter bar, the load percentage in red). The scene behind it is out of focus and pulls into focus as it loads. That is a ready-made way to give each team photo an "entrance": it racks focus in. The whole site is a 35mm camera you operate.
- Tech: WebGL, Three.js, React per listing.
- Phone: yes, the viewfinder renders at 390 px (78 percent loaded in my frame).
- Charter colours: no as built (warm amber). The mechanism carries over, the grade does not.

### 7. Studio Archive (Framer template)

- URL: https://studio-archive.framer.website/ (listing: https://www.framer.com/marketplace/templates/studio-archive/)
- Source: Framer marketplace, free
- Area: photo entrances, transitions, type in motion
- Shots: `shots/studioarchive-d.jpg`, `shots/studioarchive-s.jpg`, `shots/studioarchive-m.jpg`
- What to take: portraits mapped onto a rotating WebGL cube, driven by cursor speed, scroll and hover on the project names. A centred list of project names in letter-spaced caps sits over it, and the hovered one turns lime. On scroll the cube breaks into tilted photo planes at the screen edges. This is the best direct model for "each photo appears in a special way": photos as faces of one object that you spin, not a gallery of rectangles.
- Tech: WebGL media cube, pixel-trail shader, Framer, per listing.
- Phone: yes. The cube stays centred, names over it.
- Charter colours: yes. The ground is near-black. Swap lime for `#69C4AF`.

### 8. The Obsidian Assembly

- URL: https://obsidianassembly.com/
- Source: Awwwards Site of the Day, 14 Apr 2026 (Nuxt, TypeScript). Palette per listing: `#151415` and `#F1EADE`.
- Area: photo entrances, hero, type in motion
- Shots: `shots/obsidian-d.jpg`, `shots/obsidian-s.jpg`, `shots/obsidian-m.jpg`
- What to take: a dark page where a cluster of different-sized photos sits around one large central photo with round arrow buttons, a thin curved line crossing the whole composition, and a high-contrast serif that is partly overlapped by images. On the phone the hero is a single black glass rock with a huge serif headline wrapping behind it. The listing highlights a "particle gallery" and a WebGL mouse effect.
- Tech: Nuxt, with WebGL elements per the listing highlights.
- Phone: yes. Clear hero, though a cookie sheet covers the bottom third on first load.
- Charter colours: partly. The darkness and layout carry over, the warm brown gradient and serif do not.

### 9. Flux Theory

- URL: https://www.fluxtheory.in/
- Source: Awwwards nominee, 18 Oct 2026 (Three.js, WebGL, GSAP, 3D)
- Area: hero, transitions, type in motion
- Shots: `shots/flux-d.jpg`, `shots/flux-s.jpg`, `shots/flux-m.jpg`
- What to take: the opening is a fogged window with water droplets and a blurred figure behind it, with a headline in a noisy distorted face ("Every shower shapes a new you."). A few scroll steps later the scene resolves into a full 3D bathhouse with the product centred. The blue-teal fogged glass is the useful part: a wet-glass or frost hero that clears as you scroll is a very cheap hero-to-world transition, and its colour is close to the charter's.
- Tech: Three.js, WebGL, GSAP per listing.
- Phone: yes at the hero. The headline stacks and the droplet layer holds.
- Charter colours: the hero yes (steel blue to teal). The 3D room that follows is pink and orange, so no.

### 10. Overworld Audio

- URL: https://overworldaudio.com/
- Source: Awwwards Site of the Day, 15 Oct 2026 (Three.js, Nuxt). Palette per listing: `#13151f` and `#e9ecee`.
- Area: loader, hero, 3D world
- Shots: `shots/overworld-d.jpg` (sound gate)
- What to take: a very dark navy gate with film grain, a faint line-art logo, and two choices, "Enter with sound" and "Enter without sound". The ground colour is within a shade of the charter's `#141E27`. The listing says the work is shown as an interactive map. I only saw the gate; the "without sound" click did not register in my run.
- Tech: Three.js, Nuxt per listing.
- Phone: gate renders at 390 px. Beyond it, unverified.
- Charter colours: yes for the ground. The gate and the grain are a good model for the very first screen.

### 11. Techoice (Framer template)

- URL: https://tedious-minotaur-807429.framer.app/ (listing: https://www.framer.com/marketplace/templates/techoice/), $9
- Source: Framer marketplace
- Area: hero, motion feel
- Shots: `shots/techoice-d.jpg`, `shots/techoice-s.jpg`, `shots/techoice-m.jpg`
- What to take: a product shot over a steel-grey to black vertical gradient with grain, a big four-line headline bottom left, and one yellow word. After scroll the product pulls to a macro close-up with RGB-split edges (blue and cyan fringing) while the background goes light. The listing calls it a scroll-linked hero in 3D perspective that turns into a pinned "vision film". Useful for the chromatic edge treatment on a transition.
- Tech: Framer scroll effects; the product is rendered imagery, not live 3D, as far as I could see.
- Phone: yes.
- Charter colours: partly (the gradient and the blue accent object).

### 12. Igloo Inc

- URL: https://www.igloo.inc/
- Source: Awwwards Site of the Day, 23 Jul 2024 (3D, infinite scroll, transitions). Palette per listing: `#b6bac5` and `#383e4e`.
- Area: 3D world, motion feel
- Shots: `shots/igloo-d.jpg`, `shots/igloo-m.jpg`
- What to take: one detailed object (an igloo on snow) as the whole hero, lit like a product shot, with tiny mono UI labels pinned to the corners. Not dark in my run (pale and misty), so it earns its place only for the "one lovingly lit object, almost no chrome" idea. The font was still loading in my frame.
- Tech: 3D per listing tags, details not verified.
- Phone: yes, it renders the same scene in portrait.
- Charter colours: the pale slate is near the charter's blue-grey, but it is not a night page.

### 13. Lando Norris

- URL: https://landonorris.com/
- Source: Awwwards Site of the Day, 17 Nov 2025, 8.18 (WebGL, GSAP, Webflow). Palette per listing: `#D2FF00` and `#111112`.
- Area: photo entrances, loader
- Shots: `shots/landonorris-s.jpg`
- What to take: photos scattered across a dark olive field of faint contour lines, each with a tiny caption ("Miami GP, 2024"), some in colour, some greyscale, drifting at different depths while a quote with a hand-signed mark holds in the middle. The loader is a full-screen lime sheet that says "Load Norris". For the team-photo sequence: captions with place and year, mixed colour and greyscale, parallax depth.
- Tech: WebGL, GSAP, Webflow per listing.
- Phone: the 390 px render stayed on the lime loader in my run.
- Charter colours: no (lime). The scatter and caption pattern carry over.

### 14. Nocturnal Dream

- URL: https://www.nocturnaldream.com/
- Source: Awwwards nominee, 18 Oct 2026 (WebGL, GSAP, Three.js)
- Area: loader, type in motion
- Shots: `shots/nocturnal-s.jpg` (loader)
- What to take: the loader is the best part of what I saw. Headline words are cut-paper strips (black type on cream) with tape marks over some words, and the strips peel and curl in 3D while a percentage counts. "Close your eyes slowly. The dream is still loading." Type that is physically a strip in the scene.
- Tech: WebGL, GSAP, Three.js per listing.
- Phone: not confirmed. At 390 px it was still loading (21 percent) after 30 s under software GL.
- Charter colours: no (cream strips on black). The paper-strip headline mechanism is the takeaway.

### 15. Belgrade Arbor

- URL: https://belgradearbor.rs/en
- Source: Awwwards Site of the Day, 17 Oct 2026 (Next.js, GSAP, Three.js). Palette per listing: `#F4F0DB` and `#2E3A26`.
- Area: hero, transitions
- Shots: `shots/belgrade-s.jpg`
- What to take: a pill-shaped floating nav, a headline set in a light serif that reveals word by word with a blur-in, a "Site of the Day" tab on the right edge, and photos masked in tilted rounded shapes that sit in the scene. An "Explore in 3D" button opens the model. A progress bar and a counter ("01") at the bottom mark chapters.
- Tech: Next.js, GSAP, Three.js per listing.
- Phone: the loader only (1 percent) in my run.
- Charter colours: no (olive green and cream). Worth it only for the word-by-word blur reveal and the chapter counter.

### 16. Orizon

- URL: https://orizon.one
- Source: Awwwards nominee, 18 Oct 2026 (GSAP, Three.js, Next.js). The listing calls it a scroll-driven journey into a black hole.
- Area: motion feel, hero
- Shots: `shots/orizon-d.jpg`, `shots/orizon-s.jpg`, `shots/orizon-m.jpg`
- What to take: a section index down the left edge ("Start, Ecosystem, Kill chain, One core...") that lights as you scroll, a "Stage / Progress" readout bottom left, and rings that tighten toward a core as you go down. The page rendered in a light theme in my run, with a theme toggle in the header that I did not use, so I did not see the black-hole version.
- Tech: Three.js, GSAP, Next.js per listing.
- Phone: renders at 390 px.
- Charter colours: unknown in dark mode. The light render is white with green.

### 17. We are ZIZO

- URL: https://wearezizo.com/
- Source: Awwwards Site of the Day, 6 Feb 2020 (Three.js, Nuxt, Anime.js). Palette per listing: `#2779a7`, `#49c5b6`, `#D14836`.
- Area: loader, type in motion
- Shots: `shots/zizo-d.jpg` (loader)
- What to take: only the palette. Its two lead colours, a mid blue and an aquamarine, are nearly the charter's `#127DBB` and `#69C4AF`, which makes it a proof that this pair reads well on a playful 3D site. It is a 2020 site, light, and my run only reached the loader (a Japanese "loading" word over a pale blue sheet with white character silhouettes). Low priority.
- Phone: not confirmed.

## Seen but not usable

- Lusion (https://lusion.co/): loader only after 40 s on both viewports, so I could not judge it.
- Zentry (https://zentry.com/): logo loader only after 28 s.
- Active Theory (https://activetheory.net/): "Not Supported" page in the headless browser.
- Opal (https://opal.camera/): connection timed out.
- Event Horizon by Cleanly Studio (https://fade.run/): Vercel "Deployment paused", so the Awwwards honorable mention is no longer live at that address.
- Cosmos (https://cosmos.so/) and World Labs (https://www.worldlabs.ai/): light pages, wrong feel.
- Land-book, Lapa Ninja: blocked by Cloudflare (see top). Landingfolio: empty grid.

## Patterns that recur

- One world, the camera is the scroll. EnduroSat, Fighter Ready and Edolus hold a single persistent scene and move through it, rather than stacking separate sections.
- A near-black ground with exactly one accent colour, and white type. Vesper, EnduroSat, Eventide, Overworld, Studio Archive all do it. The charter's `#141E27` with the blue to aquamarine gradient fits this pattern directly.
- The loader is the first scene. Branded, with a real percentage: Edolus ("Initiate system"), Kinoria (viewfinder), Nocturnal (paper strips), Fighter Ready ("Lacing up"), Overworld (sound gate). Caution: they also ate most of my 30 to 45 s on software GL, so on a phone in Instagram's browser the loader has to finish fast and the first scene has to be cheap.
- Small mono readouts as UI. Eventide's "Distance to horizon", Kinoria's f-stop and shutter, Orizon's "Stage / Progress", Belgrade's chapter counter. Scroll-linked numbers make a scroll feel measured at almost no cost.
- Hand-over by a physical thing, not a fade: a door (Fighter Ready), a horizon (Eventide), a change of scale (Edolus, EnduroSat), fog clearing (Flux Theory).
- Photos live on an object or a depth field, not in a grid: a cube (Studio Archive), a viewfinder racking focus (Kinoria), a scatter with captions (Lando Norris, Obsidian).
- On the phone the strongest ones keep the same scene and re-frame it (EnduroSat, Vesper, Eventide) instead of dropping to a still. The weak ones were the ones still in their loader at 390 px.
- Headline type is big, tight and geometric, set over the scene rather than in a panel (EnduroSat, Vesper, Eventide).

## Five to anchor a direction on

1. EnduroSat Space Service: the world, the colour and the phone behaviour in one. Persistent scene, blue on navy, hero object swapped per scroll band.
2. Fighter Ready: the hand-over between acts as a physical passage, which answers "transitions without a camera flight" with a door instead of a fly-through.
3. Eventide: the hero. Headline split around one big luminous form, a mono caption telling you to scroll, a live scroll-linked readout.
4. Vesper Cinematic: the headline weight and the blue rim light on a dark star field, closest to Gilroy-style type over the charter's blue.
5. Studio Archive: the photo sequence. Faces of one rotating object, cursor-velocity driven, names over it.

Runners-up: Kinoria (the focus-pull entrance for individual photos) and Edolus (the paced scroll map with slow bands and chapter settle).

## Not checked

- Real-phone performance, and anything inside Instagram's in-app browser.
- Anything behind a loader that did not finish (Edolus past the first scene, Fighter Ready on the phone, Nocturnal, Belgrade, Overworld past the gate, Orizon in dark mode).
- Licences. None of this is for reuse. Per `docs/inspiration.md`, nothing from these sites goes into the build.
