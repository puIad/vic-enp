# getlayers.ai, 21st.dev and originkit.dev: what they offer this page

Resolves issue #3. Read on 2026-10-19. Screenshots are in `shots/` (1440x900 desktop and 390x844 phone, headless Chrome for Testing, no sign-in).

The page is dark, cinematic and 3D on Vite, React 19, Tailwind v4 and React Three Fiber (R3F), with night `#141E27` and the `#127DBB` to `#69C4AF` gradient. None of the three sites is a source of a finished recruitment page. All three are catalogues of effects and layouts. The useful part is the effect vocabulary and, for two of them, code we may be allowed to start from.

## Short answer

| Site | What it is | Code usable in our stack | Licence in one line |
|---|---|---|---|
| originkit.dev | Free-to-browse library of 700+ animated components, 76 sections, templates, by Lander Studio. Many are WebGL particle or shader scenes with a props panel. | Yes: React/Vite output, `npx originkit add <name>`. Needs a signed-in account to copy. Part of it is Pro (paid). | Custom licence, commercial use and modification allowed, no attribution. Forbids shipping the component inside a template or starter kit. |
| 21st.dev | Marketplace of 12,000+ community React components, shadcn style, with a Three.js and shader section. | Yes, per component. Several R3F ones are MIT. | No site-wide licence. Each author sets one. Some pages show none. Demos and media belong to 21st. |
| getlayers.ai | Library of prompts (templates, 3D scenes, sections, backgrounds, gradients) that your AI turns into a site. Built by Textura. | Indirectly: you copy a prompt, an AI rebuilds it. Source files only on the top paid plan, and as Next.js or standalone HTML. | Commercial licence on the output you generate. The prompts themselves may not be copied or redistributed. |

## originkit.dev

What it is: a catalogue where every component renders live with a variable panel (background, colours, density, dot size, scatter, wave, tilt, cursor response, transition). Categories include Background (253), Interactive Elements (118), Text (83), Animations (78), Image Gallery (46), Cursor (23). There are also 76 full sections (55 heroes) and templates. It also sells a 3D tool called Thrine (logo, SVG or font into animated 3D). Docs say one authored file backs every stack, and the `react` / `vite` output is a plain component. Install is `npx originkit add <name>`, which writes the source and installs the npm packages it needs.

What fits (dark, cinematic, 3D):
- Particle and wire fields: Scroll Wave Field, Cursor Ring Field, Particle Drift, Wire Terrain, Particle Saturn, Accretion Disc. Black or near-black grounds, one or two accent colours, cursor and scroll response. Direct fit for the hero world.
- Vortex and tunnel pieces: Tornado, Light Cables, Fibre Arc. Good for an act-to-act hand-over.
- Section layouts: Hero 18 (a green wire funnel under a serif headline), Hero 24 (wire globe with hands), Hero 11 and 19 (glowing object, headline left, small body copy, two CTAs). These show how type sits over a 3D layer.
- Not a fit: the light, pastel sections and the 3D-logo Thrine promos.

Licence. Source: [Licensing & Usage](https://www.originkit.dev/docs/licensing), part of the [Terms & Conditions](https://www.originkit.dev/docs/terms) (the Terms say it "forms part of these Terms").
- Name: none of the SPDX licences. It is a custom licence: "a worldwide, non-exclusive, royalty-free, perpetual license to use, modify, and incorporate that component into your own projects".
- Allowed: commercial and client work, unlimited projects, modification, open-source applications ("a real application or site rather than a redistribution of our catalog"), AI and MCP retrieval. No attribution required.
- Forbidden: shipping components inside templates, themes or starter kits; reselling them as components; republishing the catalogue; Figma or UI-kit reproductions. Its own summary: "If your customers receive the component rather than the result, you need a partnership."
- For VIC: a club landing page is "the result", not a redistributed component, so this is the allowed side. Keep the component source in our app and never publish it as a reusable kit.
- Dependencies (three, animation libraries) carry their own licences, listed on each component page. Preview fonts, images and icons are not covered.
- Unclear or to confirm: the licence page has no date or version. Copying needs a signed-in account (docs: "Copying and installing need you signed in"), and Pro components need a paid plan (the pricing page lists Pro at $79/year, Free at 10 component copies a day). The owner would have to do that step, since an agent must not sign in. The licence is granted "to you or to the organization you obtained the component on behalf of", so the account should be the club's or the owner's, stated as acting for the club. Governing law is India (Bengaluru courts).

## 21st.dev

What it is: a marketplace of community-authored React components (shadcn registry style), 2,000+ marketing blocks and 2,100+ UI components, with tag pages for shaders and Three.js. The Three.js tag lists dozens of R3F and three pieces (Warp Tunnel, Vortex, Topology Field, Quantum Nebula, Ghost Ether, Particle Wave, 3D Globe, Agentic Factory 3D, Prism Hero). The site mostly ships light-mode previews, so judge the dark look from the effect, not the thumbnail.

What fits: R3F backgrounds (warp tunnel star streaks, nebula and particle fields, aurora ribbons), shader backgrounds (Black Hole, Glass Fold, Neural Noise), hero blocks over a canvas, hover footers. Warp Tunnel is described as "built with React Three Fiber and coloured from the shadcn theme's foreground and primary tokens", which maps straight onto our charter tokens. Several R3F components depend on three, `@react-three/fiber`, `@react-three/drei` (Prism Hero) or `@paper-design/shaders-react` (Liquid Metal Hero).

Licence. Source: [21st Terms of Service](https://21st.dev/terms), sections 2 and 3.
- There is no marketplace-wide licence. The Terms say component code is "the sole and exclusive property of their respective authors and 21st Labs Inc." and that the component's own licence is "separately owned or licensed by that author". So the licence is whatever the author set on that component page.
- Checked pages on 2026-10-19: MIT shown for Ghost Ether (three, link to the repo's MIT LICENSE), Agentic Factory 3D (three), Horizon Hero Section and Hero Section 5. No licence text shown for Hero ASCII one, Prism Hero, Hyperspace Warp Drive, Quantum Nebula, Particle Wave and 3D Globe. Warp Tunnel has an empty "License" heading.
- Rule for us: use a component only if its page names a licence we can read (MIT is fine, keep the notice). A component with no licence is all rights reserved by default, so do not take it.
- Terms also forbid reusing the site's demos, previews, screenshots, video and metadata (titles, descriptions, tags) without written permission, and require "a clear and visible link back to the original component page on 21st.dev" when redistributing components elsewhere. Our shots in this folder are for internal planning only and must not ship. If we use a component, put its 21st URL in a source comment and in `docs/assets.md`.
- The Terms forbid scraping and bulk copying. Pricing shows paid plans (Builder, Team) that "include the full marketplace". I did not confirm which components the free tier can copy.

## getlayers.ai

What it is: a library of "layers" written as prompts: 55 templates, 353 3D scenes (246 tagged Dark), sections, video backgrounds, gradients, plus 13 AI design tools and a Figma plugin. You copy a layer's prompt into an AI coding tool and it builds the layer as one self-contained HTML file. The Full Stack plan adds real source (templates as Next.js, scenes and sections as standalone HTML), an MCP server and no usage cap. Each layer has a live preview with Performance and SEO tabs. Previews are video, so the screenshots show thumbnails only.

What fits:
- Technique filters on 3D scenes (2D Shader, 3D Element, Galaxy and Space, Vortex and Tunnel, Fire and Plasma, Particles, Fluid) are a ready menu of dark, cinematic world types. Free scenes include Tunnel, Flow Wave, Storm, Starfield Close, Elliptical Galaxy.
- Section prompts such as Mirror Hall, Slider Slipstream and Cards Cascade are curved photo carousels in 3D. They match the "photo entrances" area in `docs/inspiration.md`. They are Premium.
- Templates (Laocoon, Vesper) show cinematic, serif-led, dark layouts.
- The "Go full stack" pitch is Next.js. Our stack is Vite, so prompts would be rebuilt by an AI into R3F, not dropped in.

Licence. Source: [Terms of Use](https://getlayers.ai/terms-of-use), [Pricing and FAQ](https://getlayers.ai/pricing).
- Grant: "a non-exclusive, non-transferable, worldwide license to use the prompts and content you access", used to generate content for personal or commercial projects and client deliverables. "Every layer, including free layers, is licensed for commercial use" and the FAQ says no attribution.
- Limit: the licence covers "the output you generate using the prompts, not the prompts themselves". You may not copy, redistribute or sell the prompts, or scrape the library. All plans are described as "personal-use licenses subject to fair use".
- Cost: premium access is paid (Unlimited $139 lifetime, Unlimited Plus $199, Full Stack $249 on the day I read it). A free set of layers needs no card.
- Unclear: "non-transferable" and "personal-use" sit next to "for yourself or your clients". Whether a club that the account holder works for counts is not stated. Ask support or keep the account holder as the named author of the build.
- Practical risk: an AI rebuilding a layer reproduces its look. `docs/inspiration.md` already says a reference is something to learn from, not copy. Use a layer as a starting prompt, then change the world, palette and motion so it reads as VIC.

## Five strongest patterns, ranked

1. Cursor- and scroll-reactive particle field as the hero world (Originkit). Screenshot: `shots/originkit-scroll-wave-1440.jpg` (phone: `-390`). A few thousand dots shaped into a wave, warm on black, with a cursor spring and a scroll transition. Take: the structure (one field, 6 to 8 live props: density, dot size, scatter, height, wave, cursor, transition), recoloured to `#127DBB` and `#69C4AF` on `#141E27`. Build ours in R3F and treat Originkit's source as a starting point only under its licence. Phone risk: density must drop on phones and inside Instagram's browser.
2. Funnel or tunnel as the hand-over between acts (Originkit Tornado, getlayers Tunnel). Screenshots: `shots/originkit-tornado-1440.jpg`, `shots/getlayers-3d-1440.jpg`. A particle vortex whose waist and twist can be driven by scroll. Take: the idea that one geometry transforms between sections instead of a camera flight, with waist, twist and speed as scroll-driven values.
3. Headline over a 3D layer layout (Originkit Hero 11, 18, 19, 24). Screenshot: `shots/originkit-sections-1440.jpg`. Serif or light-weight headline left, tiny supporting copy, two buttons, the 3D object right or behind, nothing else on screen. Take: composition and hierarchy only (the sections are Pro, so no code). Our type is Gilroy, so use its weights to get the same contrast.
4. 3D curved photo carousel for the member photo sequence (getlayers Mirror Hall, Slider Slipstream). Screenshot: `shots/getlayers-sections-1440.jpg`. Photos sit on a curve and slide through depth with a mirrored floor. Take: the entrance idea for the "photo entrances" slot, rebuilt by us on R3F planes. The prompts are Premium and not copyable, so this is a reference to rebuild, not code.
5. Tokenised R3F backgrounds from design tokens (21st.dev Warp Tunnel, Ghost Ether, Agentic Factory 3D). Screenshots: `shots/21st-warp-tunnel-1440.jpg`, `shots/21st-threejs-1440.jpg`. Take: colours read from CSS variables (charter tokens) instead of hard-coded, so one change recolours every scene, and the star-streak tunnel as a short accent for the Apply moment. Only the MIT-labelled components are safe to start from. Warp Tunnel's licence field is empty, so rebuild it rather than copy it.

Other screenshots: `getlayers-1440.jpg`, `getlayers-templates-1440.jpg`, `21st-home-1440.jpg`, `21st-shader-1440.jpg`, `originkit-home-1440.jpg`, `originkit-pro-gate-1440.jpg` (what a Pro component shows to a visitor who is not subscribed).

## Not checked

- No live scroll, frame rate or memory test on a phone or in Instagram's in-app browser. Every Originkit and 21st scene needs that before it is trusted.
- Component source was not read. Originkit copy requires sign-in and 21st code needs its CLI or a login, and I did not sign in. I do not know whether Originkit's WebGL pieces use R3F or raw three.
- Licences were read from the live pages on 2026-10-19. They can change, and Originkit's has no version date. This is not legal advice. Where it says "confirm", the owner should ask the vendor in writing.
- 21st.dev licence status was sampled on nine 3D components, not the whole catalogue. Free-tier limits on 21st were not confirmed.
- The shared Playwright MCP browser was being used by other sessions and kept changing tabs, so the screenshots came from a separate headless Chrome run through `playwright-core`.
